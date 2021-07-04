import fs from 'fs-extra'
import path from 'path'
import yaml from 'yaml'
import space from 'check-disk-space'

let watcher = null
const configPath = 'config.yaml'
let config = { }
const queue = []

function updateConfig() {
  config = yaml.parse(fs.readFileSync(configPath, 'utf8'))
}

function saveConfig() {
  watcher.close()
  fs.writeFileSync(configPath, yaml.stringify(config))
  watcher = fs.watch(configPath, {}, updateConfig)
}

async function getDestination(src) {
  /*
  returns a valid destination or null if not found
  valid destination:
    - is not already being written too
    - has enough space for this particular plot
  */

  let dst = null
  for (let i=0; i<config.destinations.length; i++) {
    //check if destination is not already being written to
    let candidate = config.destinations[i]

    let busy = false
    for(let j=0; j<queue.length; j++) {
      let task = queue[j]
      if (task.length > 2) { // dst parameter has been appended
        if (task[2] === candidate) {
          busy = true
          break
        }
      }
    }

    if (busy) continue // skip this destination

    // now, check if destination has enough space
    let fspace
    let fsize
    try {
      fspace = await space(candidate)
      fsize = fs.statSync(src).size
    }
    catch (err) {
      console.log(err)
      return null
    }

    if (fspace.free > fsize) {
      dst = candidate
      break
    } else {
      console.log(`destination ${candidate} full, removing from config`)
      let idx = config.destinations.indexOf(candidate)
      config.destinations.splice(idx, 1)
      i-- // because size of config.destinations is reduced by 1
      saveConfig()
    }
  }
  return dst
}

function checkPlots() {
  /*
  checks for new plot files in all temp dirs and adds to the queue
  */
  config.temps.forEach(dir => {
    const files = fs.readdirSync(dir) // TODO: try catch this
    files.forEach(file => {
      if (config.ignore.indexOf(file) >= 0) {
        return
      }
      // only consider finished plots
      if (file.indexOf('.tmp') < 0) {
        // check if plot is already being moved
        if (!queue.reduce((acc, curVal) => { return acc || (curVal [0] == dir && curVal[1] == file) }, false)) {
          console.log(`found new plot: ${file}, adding to queue`)
          queue.push([dir, file])
        }
      }
    })
  })
}

async function movePlot() {
  /*
  picks the first plot from the queue and moves the corresponding file to an available destination
  */
  // throttle if concurrency limit is reached
  const active = queue.reduce((acc, curVal) => curVal.length === 3 ? ++acc : acc, 0)
  if (active >= config.queue.limit) {
    console.log('queue limit reached')
    return
  }

  if (queue.length > 0) {
    let task = null
    let idx = 0
    for (idx = 0; idx < queue.length; idx++) {
      if (queue[idx].length === 3) {
        continue
      }
      task = queue[idx]
      break
    }
    if (!task) {
      return
    }

    const [dir, plotname] = queue[idx]
    const src = path.join(dir, plotname)

    const dst = await getDestination(src)
    if (dst === null) {
      console.log(`no suitable destinations found for plot ${src}, add new destinations to the config file`)
      return
    }

    console.log(`moving plot ${src} to ${dst}`)
    queue[idx].push(dst)

    const tmpdst = path.join(dst, `${plotname}.tmp`)
    const finaldst = path.join(dst, plotname)

    // move to destination
    try {
      await fs.move(src, tmpdst)
      await fs.rename(tmpdst, finaldst)
      console.log(tmpdst)
      console.log(finaldst)
      console.log(`finished moving plot ${plotname}`)
    } catch (err) {
      console.log(err)
      return // don't remove task from queue, something was wrong
    }

    // remove from pending plots
    idx = queue.indexOf(task) // idx may have changed if some other files was copied
    queue.splice(idx, 1)
  }
}

function checkDisks () {
  /*
  checks for new disks, mounts and formats the filesystem¸
  TODO
  */
}

function main() {
  updateConfig()

  watcher = fs.watch(configPath, {}, updateConfig)

  setInterval(checkPlots, config.delays.plots * 1000)
  setInterval(movePlot, config.delays.move * 1000)
  setInterval(checkDisks, config.delays.disks * 1000)
}

main()