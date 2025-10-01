#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Script to filter deposits.json file for legitimate deposits only
 * Usage: node scripts/filterDeposits.js [path-to-deposits.json]
 */

function filterDeposits(inputFile) {
  try {
    // Read the input file
    const inputPath = path.resolve(inputFile)
    const rawData = fs.readFileSync(inputPath, 'utf8')
    const deposits = JSON.parse(rawData)

    console.log(`📖 Reading ${inputPath}`)
    console.log(`📊 Total deposits: ${deposits.length}`)

    // Filter for legitimate deposits and remove LEGIT property
    const legitimateDeposits = deposits
      .filter((deposit) => deposit.LEGIT === true)
      .map((deposit, i) => {
        const { LEGIT, ...cleanDeposit } = deposit
        return {
          ...cleanDeposit,
          leafIndex: i
        }
      })

    console.log(`✅ Legitimate deposits: ${legitimateDeposits.length}`)

    // Write the filtered data back to the original file
    fs.writeFileSync(inputPath, JSON.stringify(legitimateDeposits, null, 2))

    console.log(`💾 Filtered deposits saved to: ${inputPath}`)
    console.log(`🗑️  Removed ${deposits.length - legitimateDeposits.length} illegitimate deposits`)
  } catch (error) {
    console.error('❌ Error processing deposits:', error.message)
    process.exit(1)
  }
}

// Get input file from command line argument or use default
const inputFile = process.argv[2] || './deposits.json'

if (!fs.existsSync(inputFile)) {
  console.error(`❌ File not found: ${inputFile}`)
  console.log('📝 Usage: node scripts/filterDeposits.js [path-to-deposits.json]')
  process.exit(1)
}

filterDeposits(inputFile)
