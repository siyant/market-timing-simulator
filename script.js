const MIN_NUM_MONTHS = 24
const PREV_MONTHS_DISPLAY = 12
const CASH_UNIT = 1000

// main UI elements
const timeEl = document.getElementById("time")
const numSharesEl = document.getElementById("numShares")
const sharesValueEl = document.getElementById("sharesValue")
const cashEl = document.getElementById("cash")
const priceEl = document.getElementById("price")
const buyEl = document.getElementById("buy")
const nextEl = document.getElementById("next")

// UI elements for additional info (in accordion)
let stockPriceChart = null
const sharesHistoryTableEl = document.getElementById("sharesHistory").getElementsByTagName('tbody')[0]
const statusEl = document.getElementById("status")
const autoStatusEl = document.getElementById("autoStatus")
let assetChart = null
const resultEl = document.getElementById("result")

let previousStockDatePrice = []
let stockDatePrice = []
let assetHistory = []

let cash = 0
let timeIndex = 0
let currentPrice = null
let totalShares = 0
let autoTotalShares = 0

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

function updateSharesHistoryTable() {
  const latestMonth = assetHistory[assetHistory.length - 1]
  const row = sharesHistoryTableEl.insertRow()
  const values = [latestMonth.month, latestMonth.price, latestMonth.user.sharesBought.toFixed(2), latestMonth.auto.sharesBought.toFixed(2)]
  for (let v of values) {
    let cell = row.insertCell();
    let text = document.createTextNode(v);
    cell.appendChild(text);
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
          label: "Auto buyer shares value",
          data: assetHistory.map((d) => d.auto.sharesValue),
          lineTension: 0,
          pointRadius: 0,
          fill: false,
          borderColor: "#9B4DCA",
          borderWidth: 3
        }, {
          label: "Your shares value",
          data: assetHistory.map((d) => d.user.sharesValue),
          fill: "origin",
          lineTension: 0,
          pointRadius: 0,
          borderColor: "rgba(0,0,0,0)",
          backgroundColor: "#a8b7e4",
          borderWidth: 0
        }, {
          label: "Your shares+cash",
          data: assetHistory.map((d) => d.user.cash),
          fill: "origin",
          lineTension: 0,
          pointRadius: 0,
          borderColor: "#4d71ef",
          backgroundColor: "#8896cd",
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
    assetChart.data.datasets[0].data = assetHistory.map((d) => d.auto.sharesValue)
    assetChart.data.datasets[1].data = assetHistory.map((d) => d.user.sharesValue)
    assetChart.data.datasets[2].data = assetHistory.map((d) => d.user.cash + d.user.sharesValue)
    assetChart.update()
  }
}

function setupMonth() {
  cash += CASH_UNIT
  currentPrice = stockDatePrice[timeIndex].price
  autoSharesBought = CASH_UNIT/currentPrice
  autoTotalShares += autoSharesBought
  console.log(`Auto buyer bought ${(autoSharesBought).toFixed(2)} shares`)

  assetHistory.push({
    month: timeIndex + 1,
    price: currentPrice,
    user: {sharesBought: 0, totalShares, cash, sharesValue: Math.round(totalShares*currentPrice)},
    auto: {sharesBought: autoSharesBought, totalShares: autoTotalShares, sharesValue: Math.round(autoTotalShares*currentPrice)}
  })
}

function onGetCsv(csvText) {
  parseCsv(csvText)
  setupMonth()
  updateUi()

  buyEl.onclick = function() {
    cash -= CASH_UNIT
    const sharesBought = CASH_UNIT/currentPrice
    console.log(`You bought ${(sharesBought).toFixed(2)} shares`)
    totalShares += sharesBought

    assetHistory[timeIndex].user = {
      sharesBought: assetHistory[timeIndex].user.sharesBought + sharesBought, 
      totalShares, 
      cash,
      sharesValue: Math.round(totalShares*currentPrice)
    }
    updateUi()
  }

  nextEl.onclick = function() {
    updateSharesHistoryTable()
    timeIndex += 1
    setupMonth()
    updateUi()
  }
}

function updateUi() {
  timeEl.innerHTML = `Month ${timeIndex + 1}`
  cashEl.innerHTML = cash
  if (cash === 0) buyEl.disabled = true
  else buyEl.disabled = false

  numShares.innerHTML = totalShares.toFixed(2)
  sharesValue.innerHTML = (totalShares * currentPrice).toFixed(2)

  const usedCash = (timeIndex+1) * CASH_UNIT - cash
  statusEl.innerHTML = `You've bought: ${totalShares.toFixed(2)} shares for $${usedCash} (average price $${totalShares ? (usedCash/totalShares).toFixed(2) : '0'})`
  
  const autoUsedCash = (timeIndex+1) * CASH_UNIT
  autoStatusEl.innerHTML = `Auto-buying strategy has bought: ${autoTotalShares.toFixed(2)} shares for $${autoUsedCash} (average price $${(autoUsedCash/autoTotalShares).toFixed(2)})`

  priceEl.innerHTML = currentPrice

  updatePriceChart()
  updateAssetChart()

  if (timeIndex+1 === stockDatePrice.length) {
    nextEl.disabled = true

    const finalSharesValue = totalShares * currentPrice
    const netWorth = cash + finalSharesValue
    const autoNetWorth = autoTotalShares * currentPrice
    resultEl.innerHTML = `Your net worth is $${netWorth.toFixed(2)} ($${cash} cash, $${finalSharesValue.toFixed(2)} in shares).<br/>
    Auto buyer has $${autoNetWorth.toFixed(2)} in shares.<br/>
    You did ${(Math.abs(netWorth/autoNetWorth-1)*100).toFixed(0)}% ${netWorth >= autoNetWorth ? 'better':'worse'} than the auto buyer`
  }
}

getCsv(onGetCsv)
