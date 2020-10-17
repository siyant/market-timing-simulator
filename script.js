const NUM_MONTHS = 12
const CASH_UNIT = 1000

const cashEl = document.getElementById("cash")
const statusEl = document.getElementById("status")
const autoStatusEl = document.getElementById("autoStatus")
const priceEl = document.getElementById("price")
const buyEl = document.getElementById("buy")
const nextEl = document.getElementById("next")
const resultEl = document.getElementById("result")

let stockData = []
let cash = CASH_UNIT
let timeIndex = 0
let currentPrice = null
let numSharesBought = 0
let autoNumSharesBought = 0

function getCsv(cb) {
  const request = new XMLHttpRequest();
  request.open('GET', 'data/VTI.csv', true);
  request.overrideMimeType("text/csv")

  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      cb(request.responseText);
    }
  }

  request.send();
}

function parseCsv(csvText) {
  const csvLines = csvText.split("\n")
  const data = csvLines.slice(1).map(line => parseFloat(line.split(",")[1]).toFixed(2))

  // select random consecutive NUM_MONTHS period
  randomStartMonth = Math.round(Math.random() * (data.length - NUM_MONTHS))
  stockData = data.slice(randomStartMonth, randomStartMonth + NUM_MONTHS)
}

function onGetCsv(csvText) {
  parseCsv(csvText)
  currentPrice = stockData[timeIndex]
  autoNumSharesBought = CASH_UNIT/currentPrice
  updateUi()

  buyEl.onclick = function() {
    cash -= CASH_UNIT
    console.log(`You bought ${(CASH_UNIT/currentPrice).toFixed(2)} shares`)
    numSharesBought += CASH_UNIT/currentPrice
    updateUi()
  }

  nextEl.onclick = function() {
    timeIndex += 1
    currentPrice = stockData[timeIndex]
    autoNumSharesBought += CASH_UNIT/currentPrice
    console.log(`Auto buyer bought ${(CASH_UNIT/currentPrice).toFixed(2)} shares`)

    cash += CASH_UNIT
    updateUi()
  }
}

function updateUi() {
  cashEl.innerHTML = `Month ${timeIndex+1}: You have $${cash}`
  if (cash === 0) buyEl.disabled = true
  else buyEl.disabled = false

  const usedCash = (timeIndex+1) * CASH_UNIT - cash
  statusEl.innerHTML = `You've bought ${numSharesBought.toFixed(2)} shares for $${usedCash} so far (average price $${(usedCash/numSharesBought).toFixed(2)})`
  
  const autoUsedCash = (timeIndex+1) * CASH_UNIT
  autoStatusEl.innerHTML = `Auto buyer has bought ${autoNumSharesBought.toFixed(2)} shares for $${autoUsedCash} (average price $${(autoUsedCash/autoNumSharesBought).toFixed(2)})`

  priceEl.innerHTML = `Current share price is: $${currentPrice}`

  if (timeIndex+1 === NUM_MONTHS) {
    nextEl.disabled = true

    const finalSharesValue = numSharesBought * currentPrice
    const netWorth = cash + finalSharesValue
    const autoNetWorth = autoNumSharesBought * currentPrice
    resultEl.innerHTML = `Your net worth is $${netWorth.toFixed(2)} ($${cash} cash, $${finalSharesValue.toFixed(2)} in shares).<br/>
    Auto buyer has $${autoNetWorth.toFixed(2)} in shares.<br/>
    You did ${(Math.abs(netWorth/autoNetWorth-1)*100).toFixed(0)}% ${netWorth >= autoNetWorth ? 'better':'worse'} than the auto buyer`
  }
  
}

getCsv(onGetCsv)
