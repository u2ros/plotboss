#!/bin/bash

# setup test folders
mkdir test

mkdir test/dest1
mkdir test/dest2
mkdir test/dest3

sudo mount -t tmpfs -o size=1m tmpfs test/dest1
sudo mount -t tmpfs -o size=1m tmpfs test/dest2
sudo mount -t tmpfs -o size=1m tmpfs test/dest3

sudo chmod +rw test/dest1
sudo chmod +rw test/dest2
sudo chmod +rw test/dest3

mkdir test/temp1
mkdir test/temp2

head -c 350000 </dev/urandom > test/temp1/1.plot
head -c 350000 </dev/urandom > test/temp1/2.plot
head -c 350000 </dev/urandom > test/temp2/3.plot
head -c 350000 </dev/urandom > test/temp2/4.plot
head -c 350000 </dev/urandom > test/temp2/5.plot
head -c 350000 </dev/urandom > test/temp2/6.plot

# these two will fail, until you add another destination folder to the config
head -c 350000 </dev/urandom > test/temp2/7.plot
head -c 350000 </dev/urandom > test/temp2/8.plot

# setup test config
echo "temps:" > config.yaml
echo "  - $(pwd)/test/temp1" >> config.yaml
echo "  - $(pwd)/test/temp2" >> config.yaml
echo "ignore:" >> config.yaml
echo " - lost+found" >> config.yaml
echo "destinations:" >> config.yaml
echo "  - $(pwd)/test/dest1" >> config.yaml
echo "  - $(pwd)/test/dest2" >> config.yaml
echo "  - $(pwd)/test/dest3" >> config.yaml
echo "delays:" >> config.yaml
echo "  disks: 5" >> config.yaml
echo "  plots: 5" >> config.yaml
echo "  move: 5" >> config.yaml
echo "queue:" >> config.yaml
echo "  limit: 8" >> config.yaml
