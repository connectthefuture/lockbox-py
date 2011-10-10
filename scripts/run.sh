#!/bin/bash

python ../build/lib.linux-x86_64-2.7/lockbox/main.py \
		--lock_domain_name 'lock_domain' \
		--data_domain_name 'data_domain' \
		--blob_bucket_name 'safe-deposit-box' \
		--directory '~/lockbox'