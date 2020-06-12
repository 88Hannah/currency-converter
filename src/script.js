const btn = document.getElementById('button');
const content = document.getElementById('content');


const name = "Walter"

content.innerHTML = `
        <h2>Welcome</h2>
        <p>Hi, ${name}</p>
    `;


const changeContent = () => {

    const year = new Date().getFullYear();

    content.innerHTML = `
        <h2>Hello</h2>
        <p>It is the year ${year}</p>
    `;

};

btn.addEventListener('click', changeContent);

