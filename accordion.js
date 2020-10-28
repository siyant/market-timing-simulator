const accordions = document.getElementsByClassName("accordion");

for (let acc of accordions) {
  acc.onclick = function() {
    this.classList.toggle("active")
    this.nextElementSibling.classList.toggle("active")
  }
}
