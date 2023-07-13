#!/bin/bash
pm2 stop all
pm2 delete all
cd /home/ubuntu/
rm -rf getlucky-node
