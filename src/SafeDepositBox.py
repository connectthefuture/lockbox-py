#!/usr/bin/env python

import ConfigParser
import os
import stat
import time
from threading import Thread
from S3BucketPolicy import string_to_dns
from EncryptionService import EncryptionService
from S3Sandbox import S3Bucket
from util import execute

class SafeDepositBox(Thread):
    def __init__(self, sdb_directory, admin_directory,
                 display_name, location):
        Thread.__init__(self)
        self.admin_directory = admin_directory
        self.sdb_directory = sdb_directory
        self.display_name = display_name
        self.location = location

        self.STATUS = 0
        self.MTIME  = 1

        self.NOT_VISITED = 0
        self.UNCHANGED   = 1
        self.UPDATED     = 2

        self.known_files = dict() # file -> [updated?, file's mtime]
        self.IDLE_WINDOW = 1 # sec

    def init_encryption_service(self):
        self.enc_service = EncryptionService(self.display_name,
                                             self.location,
                                             self.admin_directory,
                                             use_default_location=True)

    def init_s3bucket(self):
        config = ConfigParser.ConfigParser()
        #config.read("/home/tierney/conf/aws.cfg")
        config.read("/Users/tierney/conf/aws.cfg")
        aws_access_key_id = config.get('aws','access_key_id')
        aws_secret_access_key = config.get('aws','secret_access_key')
    
        self.s3bucket = S3Bucket(self.display_name, self.location, 'testfiles.sdb',
                                 aws_access_key_id, aws_secret_access_key)
        self.s3bucket.init()
        
    def upload_file(self, filename):
        bundle_filename = self.enc_service.bundle(filename)
        self.s3bucket.send_filename(bundle_filename, bundle_filename)
        execute("rm -f %s" % bundle_filename)
        
    def download_file(self, filename):
        # get file...
        self.enc_service.unbundle(filename)
        
    def reset_known_files(self):
        for filename in self.known_files:
            self.known_files[filename][self.STATUS] = self.NOT_VISITED

    def upload_updated_files(self):
        pass

    def delete_not_visited_files(self):
        delete_list = []
        for filename in self.known_files:
            if (self.NOT_VISITED == self.known_files[filename][self.STATUS]):
                # k = b.s3.key.Key(b, filename)
                # k.delete()
                print "Removing", filename
                delete_list.append(filename)
        for filename in delete_list:
            del self.known_files[filename]

    def walktree(self, top, callback):
        '''recursively descend the directory tree rooted at top,
           calling the callback function for each regular file'''
        top = os.path.abspath(top)

        for filename in os.listdir(top):
            pathname = os.path.join(top, filename)
            mode = os.stat(pathname)[stat.ST_MODE]
            if stat.S_ISDIR(mode):
                # It's a directory, recurse into it
                self.walktree(pathname, callback)
            elif stat.S_ISREG(mode):
                # It's a file, call the callback function
                callback(pathname)
            else:
                # Unknown file type, print a message
                print 'Skipping %s' % pathname

    def mod_files(self, filename):
        filename_mtime = os.stat(filename).st_mtime
        if filename in self.known_files:
            if (self.known_files[filename][self.MTIME] < filename_mtime):
                self.known_files[filename][self.STATUS] = self.UPDATED
                self.known_files[filename][self.MTIME] = filename_mtime
                print "Should encrypt and upload", filename
                self.upload_file(filename)
            else:
                self.known_files[filename][self.STATUS] = self.UNCHANGED
        else:
            self.known_files[filename] = [self.UPDATED, filename_mtime]
            print "Check if file is already uploaded as current version", filename, filename_mtime

    def run(self):
        while True:
            # figure out who's new and who's updated
            self.walktree(self.sdb_directory, self.mod_files)

            # see if anyone needs removing
            # print self.known_files
            # uploaded_updated_files()
            self.delete_not_visited_files()
            self.reset_known_files()

            time.sleep(self.IDLE_WINDOW)
    
if __name__ == '__main__':
    display_name = "John Smith"
    display_location = "iMac"

    display_name = string_to_dns(display_name)
    display_location = string_to_dns(display_location)

    sdb_directory = "../test/data"
    admin_directory = os.path.join(os.environ['HOME'],
                                   ".safedepositbox")
    s = SafeDepositBox(sdb_directory, admin_directory,
                       display_name, display_location)
    s.init_encryption_service()
    s.init_s3bucket()
    # s.upload_file('DESIGN')

    # s.daemon = True
    s.start()
