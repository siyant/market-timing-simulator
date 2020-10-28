const MIN_NUM_MONTHS = 24
const PREV_MONTHS_DISPLAY = 12
const CASH_UNIT = 1000

const cashEl = document.getElementById("cash")
const statusEl = document.getElementById("status")
const autoStatusEl = document.getElementById("autoStatus")
const priceEl = document.getElementById("price")
const buyEl = document.getElementById("buy")
const nextEl = document.getElementById("next")
const resultEl = document.getElementById("result")

let stockPriceChart = null
let previousStockDatePrice = []
let stockDatePrice = []
let assetChart = null
let assetHistory = []

let cash = 0
let timeIndex = 0
let currentPrice = null
let numSharesBought = 0
let autoNumSharesBought = 0

window.onkeydown = function(e) {
  if (e.keyCode === 66) buyEl.click() // "b" key pressed = click "buy" button
  else if (e.keyCode === 78) nextEl.click() // "n" key pressed = click "next" button
}

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
  const csvData = csvLines.slice(1).map(line => line.split(","))

  // select random start month
  startMonth = PREV_MONTHS_DISPLAY + Math.round(Math.random() * (csvData.length - MIN_NUM_MONTHS - PREV_MONTHS_DISPLAY))
  console.log({startMonth})

  // populate stockDatePrice: [{ month: -12, price: "10.00"}, ...] until end of data
  previousStockDatePrice = []
  stockDatePrice = []
  for (let i = -PREV_MONTHS_DISPLAY; i < 0; i++) {
    previousStockDatePrice.push({ 
      month: i,
      price: parseFloat(csvData[startMonth+i][1]).toFixed(2)
    })
  }
  for (let i = 0; startMonth+i < csvData.length; i++) {
    stockDatePrice.push({ 
      month: i,
      price: parseFloat(csvData[startMonth+i][1]).toFixed(2)
    })
  }
  console.log({stockDatePrice})
}

function updatePriceChart() {
  // show prices up to the current month
  const dataToDisplay = previousStockDatePrice.concat(stockDatePrice.slice(0, timeIndex+1))
  
  if (!stockPriceChart) {
    // init chart
    var ctx = document.getElementById('priceChart')
    stockPriceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dataToDisplay.map((d) => d.month),
        datasets: [{
          label: "VTI",
          data: dataToDisplay.map((d) => d.price),
          lineTension: 0,
          pointRadius: 0,
          fill: false,
          borderColor: "#3FBBB6",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
          mode: 'index',
          intersect: false,
        },
      }
    });
  } else {
    // update chart data
    stockPriceChart.data.labels = dataToDisplay.map((d) => d.month)
    stockPriceChart.data.datasets[0].data = dataToDisplay.map((d) => d.price)
    stockPriceChart.update()
  }
}

function updateAssetChart() {
  // [{month: 1, user: {cash, numShares, sharesValue}, auto: {numShares, sharesValue}}]

  if (!assetChart) {
    // init chart
    var ctx = document.getElementById('assetChart')
    assetChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: assetHistory.map(d => d.month),
        datasets: [{
          label: "Your shares value",
          data: assetHistory.map((d) => d.user.sharesValue),
          fill: "origin",
          lineTension: 0,
          pointRadius: 0,
          // borderColor: "#3FBBB6",
          backgroundColor: "#a8b7e4",
          // borderWidth: 2
        }, {
          label: "Your shares+cash",
          data: assetHistory.map((d) => d.user.cash),
          fill: 0,
          lineTension: 0,
          pointRadius: 0,
          borderColor: "#4d71ef",
          backgroundColor: "#8896cd",
          borderWidth: 3
        }, {
          label: "Auto buyer shares value",
          data: assetHistory.map((d) => d.auto.sharesValue),
          lineTension: 0,
          pointRadius: 0,
          fill: false,
          borderColor: "#9B4DCA",
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  } else {
    // update chart data
    assetChart.data.labels = assetHistory.map(d => d.month)
    assetChart.data.datasets[0].data = assetHistory.map((d) => d.user.sharesValue)
    assetChart.data.datasets[1].data = assetHistory.map((d) => d.user.cash + d.user.sharesValue)
    assetChart.data.datasets[2].data = assetHistory.map((d) => d.auto.sharesValue)
    assetChart.update()
  }
}

function setupMonth() {
  cash += CASH_UNIT
  currentPrice = stockDatePrice[timeIndex].price
  autoNumSharesBought += CASH_UNIT/currentPrice
  console.log(`Auto buyer bought ${(CASH_UNIT/currentPrice).toFixed(2)} shares`)

  assetHistory.push({
    month: timeIndex,
    user: {cash: cash, numShares: numSharesBought, sharesValue: Math.round(numSharesBought*currentPrice)},
    auto: {numShares: autoNumSharesBought, sharesValue: Math.round(autoNumSharesBought*currentPrice)}
  })
}

function onGetCsv(csvText) {
  parseCsv(csvText)
  setupMonth()
  updateUi()

  buyEl.onclick = function() {
    cash -= CASH_UNIT
    console.log(`You bought ${(CASH_UNIT/currentPrice).toFixed(2)} shares`)
    numSharesBought += CASH_UNIT/currentPrice
    assetHistory[timeIndex].user = { cash: cash, numShares: numSharesBought, sharesValue: Math.round(numSharesBought*currentPrice) }
    updateUi()
  }

  nextEl.onclick = function() {
    timeIndex += 1
    setupMonth()
    updateUi()
  }
}

function updateUi() {
  cashEl.innerHTML = `Month ${timeIndex+1}: You have $${cash}`
  if (cash === 0) buyEl.disabled = true
  else buyEl.disabled = false

  const usedCash = (timeIndex+1) * CASH_UNIT - cash
  statusEl.innerHTML = `You've bought: ${numSharesBought.toFixed(2)} shares for $${usedCash} (average price $${numSharesBought ? (usedCash/numSharesBought).toFixed(2) : '0'})`
  
  const autoUsedCash = (timeIndex+1) * CASH_UNIT
  autoStatusEl.innerHTML = `Auto buyer has bought: ${autoNumSharesBought.toFixed(2)} shares for $${autoUsedCash} (average price $${(autoUsedCash/autoNumSharesBought).toFixed(2)})`

  priceEl.innerHTML = `Current share price is: <b>$${currentPrice}</b>`

  updatePriceChart()
  updateAssetChart()

  if (timeIndex+1 === stockDatePrice.length) {
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
