function GenerateNumber() {
    const min = Math.ceil(document.querySelector('.min').value);
    const max = Math.floor(document.querySelector('.max').value);
    console.log(min, max);

    const result = Math.floor(Math.random() * (max - min + 1)) + min;

    // Seleciona o primeiro elemento com a classe 'saida-valor'
    const resultado = document.getElementsByClassName('saida-valor')[0];
    resultado.textContent = result;
}