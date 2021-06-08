# plotboss

## About

**!! This tool is currently in test phase, not ready for production !!**

Plotboss is a node.js utility for auto moving chia finished plots from a centralized temporary drive  to a final array of destination disks in a JBOD setup.

*OS support: This application supports unix systems and will not work on windows.*

*We recommend using it in combination with [plotman](https://github.com/ericaltendorf/plotman)*. Plotman destination drives are temp drives of plotboss.

Typical hardware setup this app is intended for:
- server with a temporary drive for finished plots and a JBOD
- several independent nodes (PCs) acting as plotters with the same temporary destination drive residing on a network server that also exposes disks in a JBOD fashion (this server runs plotboss)

TODO: Add support for automatic recognition filesystem format and mounting of newly added disks.

# Functionality

- automatically detects plots from the list of specified temp folders (ignores .tmp files)
- automatically load balances moving of plots to destinations (individual disks)
- automatically removes full destinations from destination list
- throttles move operations to one per destination
- automatically detects, mounts new disks and updates config
- allows on the config changes while running
# Install and run

make sure you have node.js > 14.0 (to support module level async await).

```
git clone](https://github.com/u2ros/plotboss.git
cd plotman
npm install
```

To get some feeling how the app works, run the test setup script:

`./test_setup.sh`

This will create a directory called test, inside, 2 temp and 3 dest directories. A bunch of 0.35Mb .plot files will be created in both temp directories. Dest folder will be changed to 1Mb ramdisks to simulate

Remove the mounts and test dir by running:

`./test_cleanup.sh`

A default config file will remain which you can modify to your needs. (yours will look slightly different depending on where you cloned the repo)

```
temps:                             #list of temprary folders, at least one
  - /home/dev/plotboss/test/temp1
  - /home/dev/plotboss/test/temp2
destinations:                      #list of destination folders, probably as many as you have disks
  - /home/dev/plotboss/test/dest1
  - /home/dev/plotboss/test/dest2
  - /home/dev/plotboss/test/dest3
delays:
  disks: 5                         #interval for check disks function (seconds)
  plots: 5                         #interval for checking for ne plots on temp paths
  move: 5                          #stagger for moving plots from temp to dest
queue:
  limit: 8                         #maximum number of concurrent moves
```

After modifying your config.yaml file (or leave it as it is for the test run), start the tool with:

`node plotman.mjs`