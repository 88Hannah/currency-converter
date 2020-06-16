/***************************************************
 *              CURRENCY CONTROLLER                *
 ***************************************************/

const CurrencyController = (function() {

    async function getCurrencyNames() {
        try {
            const jsonCurrencyNames = await fetch(`https://openexchangerates.org/api/currencies.json?app_id=ad5bc39fc8ff4b4ba0d8eb9a6fd6d525`)
            const currencyNamesObject = await jsonCurrencyNames.json();
            return currencyNamesObject;
        } catch(error) {
            alert(error);
        };
    };  
    

    async function getAvailableCurrencies() {
        try{
            const jsonLatestEuroRates = await fetch('https://api.openrates.io/latest?')
            const latestEuroRates = await jsonLatestEuroRates.json();
            return latestEuroRates;
        } catch(error) {
            alert(error);
        };
    };


    async function getAvailableCurrencyCodes() {
        try{
            const availableCurrencies = await getAvailableCurrencies();
            const currencyCodeArray = Object.keys(availableCurrencies.rates);
            return currencyCodeArray;
        } catch(error) {
            alert(error);
        };
    };


    // Functions the global controller can access
    return {

        // Returns an array of currency codes and names
        getCurrencies: async () => {
            try{
                const codesArray = await getAvailableCurrencyCodes();
                const currencyNames = await getCurrencyNames();
                const currencyNameAndCode = codesArray.map(element => {
                    if (currencyNames[element]) {
                        return (
                            {
                                code: element,
                                currencyName: currencyNames[element]
                            }
                        );
                    };
                });
                console.log(currencyNameAndCode);
                return currencyNameAndCode;
            } catch(error) {
                alert(error);
            };  
        },


        getRates: async base => {
            try {
                const jsonRates = await fetch(`https://api.openrates.io/latest?base=${base}`);
                const rates = await jsonRates.json();
                return rates;
            } catch(error) {
                alert(error);
            }
        },


        getFlagData: async currency => {
            try {
                const jsonFlagData = await fetch(`https://restcountries.eu/rest/v2/currency/${currency}?fields=name;flag`)
                const flagData = await jsonFlagData.json();
                return flagData;
            } catch(error) {
                alert(error);
            };
        }

    } //End of the currency controller return
})();




/***************************************************
 *                  UI CONTROLLER                  *
 ***************************************************/

const UIController = (function() {

    const DOMstrings = {
        currencyFromOptions: document.getElementById('currencyFromOptions'),
        currencyFromInput: document.getElementById('currencyFrom'),
        currencyToOptions: document.getElementById('currencyToOptions'),
        currencyToInput: document.getElementById('currencyTo'),
        fromAmount: document.getElementById('fromAmount'),
        toAmount: document.getElementById('toAmount'),
        convertButton: document.querySelector('.convert'),
        fromFlags: document.querySelector('.fromFlags'),
        toFlags: document.querySelector('.toFlags')
    };


    getDataCode = element => {
        return element.options[element.selectedIndex].dataset.code;
    };


    // Functions the global controller can access
    return {

        getDOMstrings: () => {
            return DOMstrings;
        },
        

        populateCurrencies: (currencyArray, HTMLelement) => {
            currencyArray.forEach(currency => {
                HTMLelement.insertAdjacentHTML('beforeend', `
                   <option data-code=${currency.code}>${currency.currencyName} (${currency.code})</option>
                `);
            });
        },

        
        getInput: () => {
            const fromCurrency = getDataCode(DOMstrings.currencyFromInput);
            const toCurrency = getDataCode(DOMstrings.currencyToInput);
            const amount = DOMstrings.fromAmount.value;
            return {
                fromCurrency,
                toCurrency,
                amount
            }
        },


        displayConversion: amount => {
            toAmount.value = amount;
        },


        displayFlags: (dataArray, HTMLelement) => {
            // Clear previous flags
            HTMLelement.innerHTML = '';

            dataArray.forEach(country =>{
                const name = country.name;
                const flag = country.flag;

                HTMLelement.insertAdjacentHTML('beforeend', `
                    <div>
                        <p>${name}<p>
                        <img src="${flag}" alt="The flag of ${name}">
                    </div>
                `);
            });
        }

    } //End of the UI controller return

})();




/***************************************************
 *            GLOBAL APP CONTROLLER                *
 ***************************************************/

const controller = (function(CurrencyCtrl, UICtrl) {

    const DOM = UICtrl.getDOMstrings();

    const state = {
        rates: {},
        flags: {}
    };
  

    async function retrieveCurrencies() {
        if(!localStorage.currencies) {
            try {
            const currencies = await CurrencyCtrl.getCurrencies();
            localStorage.setItem('currencies', JSON.stringify(currencies));
            } catch (error) {
                alert(error);
            };
        };
    };


    displayCurrencies = () => {
        retrieveCurrencies();
        const currenciesArray = JSON.parse(localStorage.getItem('currencies'));
        UICtrl.populateCurrencies(currenciesArray, DOM.currencyFromInput);
        UICtrl.populateCurrencies(currenciesArray, DOM.currencyToInput);

    };


    setupEventListeners = async () => {
        DOM.convertButton.addEventListener('click', () => {
            convertCurrency();
            inputData = UICtrl.getInput();
            updateFlags(inputData.fromCurrency, DOM.fromFlags);
            updateFlags(inputData.toCurrency, DOM.toFlags);
            console.log(state);
        });
    };

    
    async function retrieveRates(base) {
        try {
            const rates = await CurrencyCtrl.getRates(base);
            state.rates[base] = rates;
            return rates;
        } catch (error) {
            alert(error);
        };
    };
    
    
    checkTime = () => {
        const offset = new Date().getTimezoneOffset();
        const todayMilliseconds = new Date().getTime() + (offset * 60 * 1000); 
        const today = new Date(todayMilliseconds);
        const year = today.getFullYear();
        const month = today.getMonth();
        const day = today.getDate();
        // Rates are updated at 2pm UTC each day
        const dataChangeTime = new Date(Date.UTC(year, month, day, 14, 00));
        const yesterday = new Date(todayMilliseconds - (24 * 60 * 60 * 1000));

        if (today < dataChangeTime) {
            return yesterday;
        } else {
            return today;
        };
    };


    async function requestRates(base) {

        const compareDateLong = checkTime();
        const compareDate = compareDateLong.toISOString().split('T')[0];
        
        let rates;
        // Check if the base rates are already saved
        if(state.rates[base] && state.rates[base].date === compareDate) {
            rates = state.rates[base];
        // Otherwise call the API
        } else {
            try {
                rates = await retrieveRates(base); 
            } catch (error) {
                alert(error);
            };
        };
        return rates;  
    };


    //Get the rates needed for this current conversion
    useRates = async (base, to) => {
        const baseRateObject = await requestRates(base);
        const toRate = baseRateObject.rates[to];
        return toRate;
    };


    convertCurrency = async () => {
        // Get the input object
        const input = UICtrl.getInput();
        const baseCurrency = input.fromCurrency;
        const toCurrency = input.toCurrency;
        const amount = input.amount;
        
        // Get the rates
        const exchangeRate = await useRates(baseCurrency, toCurrency);
         
        // Use the rates to convert the value
        const convertedValue = (amount * exchangeRate).toFixed(2);

        // Display the conversion to the user
        UICtrl.displayConversion(convertedValue);

        return input;
    };


    async function retrieveFlags(code) {
        try {
            const flagData = await CurrencyCtrl.getFlagData(code);
            state.flags[code] = flagData;
            return flagData;
        } catch (error) {
            alert(error);
        };
    };


    async function requestFlags(code) {
   
        let flagArray;
        // Check if the flag data is already saved
        if(state.flags[code]) {
            flagArray = state.flags[code];
        // Otherwise call the API
        } else {
            try {
                flagArray = await retrieveFlags(code); 
            } catch (error) {
                alert(error);
            };
        };
        return flagArray;  
    };


    updateFlags = async (currencyCode, HTMLelement) => {
        const flagArray = await requestFlags(currencyCode);
        UICtrl.displayFlags(flagArray, HTMLelement);
    };


    // The functions initially need to be run
    return {
        init: () => {
           displayCurrencies();
           setupEventListeners();  
        }
    }
    
})(CurrencyController, UIController)


//Run the initial functions
controller.init();
