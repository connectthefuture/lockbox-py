#!/usr/bin/env python

import os
import hashlib
from S3BucketPolicy import string_to_dns
from util import execute, init_dir

class EncryptionService:
    def __init__(self, display_name, location, admin_directory, prefix_to_ignore,
                 filename_pub_pem_key=None, filename_priv_pem_key=None,
                 use_default_location=True):
        self.display_name = display_name
        self.location = location
        self.prefix_to_ignore = prefix_to_ignore

        self.admin_directory = admin_directory
        init_dir(self.admin_directory)

        self.staging_directory = os.path.join(self.admin_directory, 'staging')
        init_dir(self.staging_directory)

        # This dictionary should maintain state about 'for whom a file
        # should be accessible'
        self.file_to_writers = dict() # file -> (AWS email address)
        
        self.public_key_directory = os.path.join(self.admin_directory, "public_keys")
        init_dir(self.public_key_directory)

        if (None == filename_pub_pem_key and use_default_location):
            pub_pem_key = "%s.%s.public.pem" % (self.display_name, self.location)
            filename_pub_pem_key = os.path.join(self.public_key_directory, pub_pem_key)
            self.filename_priv_pem_key = filename_pub_pem_key

        if (None == filename_priv_pem_key and use_default_location):
            priv_pem_key = "%s.%s.private.pem" % (self.display_name, self.location)
            filename_priv_pem_key = os.path.join(self.admin_directory, priv_pem_key)
            self.filename_pub_pem_key = filename_priv_pem_key
        
    def generate_pki_keys(self):
        if os.path.exists(self.filename_pub_pem_key): 
            os.remove(self.filename_pub_pem_key)
        if os.path.exists(self.filename_priv_pem_key): 
            os.remove(self.filename_priv_pem_key)

        gen_priv_key_cmd = "openssl genrsa -out '%s' 2048" % (filename_priv_pem_key)
        gen_pub_key_cmd = "openssl rsa -in '%s' -pubout -out '%s'" % (filename_priv_pem_key,
                                                                      filename_pub_pem_key)
        execute(gen_priv_key_cmd)
        execute(gen_pub_key_cmd)

    def _hash_path(self, filepath):
        return hashlib.md5(filepath).hexdigest()

    def _hash_flatten_filepath(self, filepath):
        fphash = self._hash_path(filepath)
        return ".".join([fphash, os.path.split(filepath)[1]])
    
    def encrypt(self, filepath_to_encrypt):
        """
        file_to_encrypt - full filepath to the file that we want to encrypt
        """
        # generate random AES-256 (symmetric key) password. Put in file.
        file_to_encrypt = self._hash_flatten_filepath(filepath_to_encrypt)
        print "FILE TO ENCRYPT:", file_to_encrypt
        password_filename = os.path.join(self.staging_directory, "%s.aes256" % file_to_encrypt)
        execute("head -c 128 /dev/urandom | openssl enc -base64 > '%s'" %
                (password_filename))

        # encrypt file with symmetric key -> file.enc
        encrypted_filename = os.path.join(self.staging_directory, file_to_encrypt+".enc")
        execute("openssl enc -aes-256-cbc -salt -in '%s' -out '%s' -pass file:'%s'" %
                (filepath_to_encrypt, encrypted_filename, password_filename))

        # encrypt key file with public key -> key.enc
        encrypted_password_filename = password_filename + ".enc"
        execute("openssl rsautl -in '%s' -inkey '%s' -pubin -encrypt -pkcs -out '%s'" %
                (password_filename, self.filename_pub_pem_key, encrypted_password_filename))
        execute("rm -f %s" % password_filename)
        return (encrypted_filename, encrypted_password_filename)

    def decrypt(self, file_to_decrypt, encrypted_password_file):
        # decrypt key file with private key
        decrypted_password_filename = encrypted_password_file.rstrip('.enc')
        execute("openssl rsautl -in '%s' -inkey '%s' -decrypt -pkcs -out '%s'" %
                (encrypted_password_file, self.filename_pub_pem_key,
                 decrypted_password_filename))
        # decrypt file with symmetric key -> file
        decrypted_filename = file_to_decrypt.rstrip('.enc')
        execute("openssl enc -d -aes-256-cbc -in '%s' -pass file:'%s' -out '%s'" %
                (file_to_decrypt, decrypted_password_filename, decrypted_filename))
        execute("rm -f %s %s %s" % (encrypted_password_file, file_to_decrypt,
                                    decrypted_password_filename))

    def bundle(self, filepath):
        fphash = self._hash_path(filepath)
        encrypted_filename, encrypted_password_file = self.encrypt(filepath)
        # combine the encrypted_filename and encrypted_password_file into
        # filename.displayname_location
        filename = self._hash_flatten_filepath(filepath)
        zipped_file = "%s.%s_%s" % (filename, self.display_name, self.location)
        zipped_filepath = os.path.join(self.staging_directory, zipped_file)
        execute("rm -f %s" % zipped_filepath)
        execute("tar cjf %s %s %s" % (zipped_filepath, encrypted_filename, encrypted_password_file))
        # print encrypted_filename, encrypted_password_file
        # Clean-up (upload to the cloud and then clean-up)
        execute("rm -f %s %s" % (encrypted_filename, 
                                 encrypted_password_file))
        # execute("rm -f %s.%s_%s" % (filename, self.display_name, self.location))
        return "%s.%s_%s" % (filename, self.display_name, self.location)

    def unbundle(self, bundle_filename):
        execute("tar xf %s" % bundle_filename)
        filename = "".join(bundle_filename.split('.')[:-1])
        file_to_decrypt = filename + ".enc"
        encrypted_password_file = filename + ".aes256.enc"
        self.decrypt(file_to_decrypt, encrypted_password_file)
        execute("rm -f %s" % bundle_filename)
        return filename

def main():
    display_name = "John Smith"
    location = "iMac"

    display_name = string_to_dns(display_name)
    display_location = string_to_dns(location)
    admin_directory = os.path.join(os.environ['HOME'], ".safedepositbox")

    es = EncryptionService(display_name, display_location, admin_directory)
    es.generate_pki_keys()
    bundlename = es.bundle('DESIGN')
    # upload bundle
    filename = es.unbundle(bundlename)
    print filename
    
if __name__=="__main__":
    main()
