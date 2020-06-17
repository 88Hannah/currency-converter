/***************************************************
 *              CURRENCY CONTROLLER                *
 ***************************************************/

const CurrencyController = (function() {

    // Returns an object where the key is the currency code and the value is the currency name
    getCurrencyNames = async () => {
        try {
            const jsonCurrencyNames = await fetch(`https://openexchangerates.org/api/currencies.json?app_id=ad5bc39fc8ff4b4ba0d8eb9a6fd6d525`)
            const currencyNamesObject = await jsonCurrencyNames.json();
            return currencyNamesObject;
        } catch(error) {
            console.log(`There was a problem in the getCurrencyNames function with the error message: ${error}`);
        };
    };  
    

    // Returns an object with keys: base and rates. 
    // The value of rates is an object with currency code keys and exchange rate values
    getAvailableCurrencies = async () => {
        try{
            const jsonLatestEuroRates = await fetch('https://api.openrates.io/latest?')
            const latestEuroRates = await jsonLatestEuroRates.json();
            return latestEuroRates;
        } catch(error) {
            console.log(`There was a problem in the getAvailableCurrencies function with the error message: ${error}`);
        };
    };


    // Use the available currencies API to get an array of the currency codes
    getAvailableCurrencyCodes = async () => {
        try{
            const availableCurrencies = await getAvailableCurrencies();
            const currencyCodeArray = Object.keys(availableCurrencies.rates);
            return currencyCodeArray;
        } catch(error) {
            console.log(`There was a problem in the getAvailableCurrencyCodes function with the error message: ${error}`);
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
                return currencyNameAndCode;
            } catch(error) {
                console.log(`There was a problem in the getCurrencies function with the error message: ${error}`);
            };  
        },


        // A class for each currency with the required currency methods
        Currency: class {
            constructor(code, currencyName) {
                this.currencyCode = code;
                this.currencyName = currencyName;
                this.ratesDate = '';
                this.exchangeRates = [];
                this.countriesUsed = [];
            }


            async getRates() {
                try {
                    const jsonRatesData = await fetch(`https://api.openrates.io/latest?base=${this.currencyCode}`);
                    const ratesData = await jsonRatesData.json();
                    this.ratesDate = ratesData.date
                    
                    // Clear the array of previous data
                    this.exchangeRates = [];

                    for (const currencyCode in ratesData.rates) {
                        this.exchangeRates.push({
                            exchangeCode: currencyCode,
                            exchangeRate: ratesData.rates[currencyCode]
                        })
                    };

                } catch(error) {
                    console.log(`There was a problem in the getRates function with the error message: ${error}`);
                };
            }


            async getFlagData() {
                try {
                    const jsonFlagData = await fetch(`https://restcountries.eu/rest/v2/currency/${this.currencyCode}?fields=name;flag`)
                    const flagData = await jsonFlagData.json();
                    
                    flagData.forEach(country => {

                        this.countriesUsed.push({
                            countryName: country.name,
                            flagURL: country.flag
                        });
                    });

                } catch(error) {
                    console.log(`There was a problem in the getFlagData function with the error message: ${error}`);
                };
            }

        } // End of the currency class

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
                   <option data-code=${currency.currencyCode}>${currency.currencyName} (${currency.currencyCode})</option>
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
                const name = country.countryName;
                const flag = country.flagURL;

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
        currencies: []
    };
    
    
    /******** Initial set up functions ********/

    initialiseStateCurrencies = async () => {
        try {
            const currencies = await CurrencyCtrl.getCurrencies();
            currencies.forEach(object => {
                state.currencies.push(new CurrencyCtrl.Currency(object.code, object.currencyName));
            });
        }  catch(error) {
            console.log(`The populateStateCurrencies function failed with this error: ${error}`);
        };
    };
    
    
    displayCurrencies = async () => {
        await initialiseStateCurrencies()
        UICtrl.populateCurrencies(state.currencies, DOM.currencyFromInput);
        UICtrl.populateCurrencies(state.currencies, DOM.currencyToInput);

    };


    setupEventListeners = async () => {
        DOM.convertButton.addEventListener('click', () => {
            inputData = UICtrl.getInput();
            baseCurrency = inputData.fromCurrency;
            toCurrency = inputData.toCurrency
            amount = inputData.amount
            convertCurrency(baseCurrency, toCurrency, amount);
            updateFlags(baseCurrency, DOM.fromFlags);
            updateFlags(toCurrency, DOM.toFlags);
        });
    };

    
    /******** Function for the rates ********/

    retrieveRates = async base => {
        try {
            await state.currencies.find(currency => currency.currencyCode === base).getRates();
        } catch (error) {
            console.log(`There was a problem with the retrieveRates function with the error message: ${error}`);
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


    //Calculate the rates  for the base currency and return the exchange rate required
    requestRates= async (base, to) => {
        const compareDateLong = checkTime();
        const compareDate = compareDateLong.toISOString().split('T')[0];
        const currentCurrency = state.currencies.find(currency => currency.currencyCode === base);
        // Only call the API if the exchange rates are not saved or outdated
        if (!(currentCurrency.ratesDate === compareDate)) {
            try {
                await retrieveRates(base); 
                
            } catch (error) {
                console.log(`There was a problem calling the retrieveRates function within the requestRates function with the error message: ${error}`)
            };
        };
        const toRate = currentCurrency.exchangeRates.find(currency => currency.exchangeCode === to).exchangeRate;
        return toRate;    
    };


    convertCurrency = async (baseCurrency, toCurrency, amount) => {        
        // Get the rates
        const exchangeRate = await requestRates(baseCurrency, toCurrency);
         
        // Use the rates to convert the value
        const convertedValue = (amount * exchangeRate).toFixed(2);

        // Display the conversion to the user
        UICtrl.displayConversion(convertedValue);
    };


    /******** Functions for the flags ********/

    requestFlags = async code => {
        const currentCurrency = state.currencies.find(currency => currency.currencyCode === code)
        // Only call the API if the flag data isn't saved
        if(currentCurrency.countriesUsed.length === 0) {
            try {
                await currentCurrency.getFlagData(); 
            } catch (error) {
                console.log(`There was a problem with the requestFlags function with the error message: ${error}`);
            };
        };
    };


    updateFlags = async (code, HTMLelement) => {
        const currentCurrency = state.currencies.find(currency => currency.currencyCode === code)
        try {
            await requestFlags(code);
            UICtrl.displayFlags(currentCurrency.countriesUsed, HTMLelement);
        } catch (error) {
            console.log(`There was a problem with the updateFlags function with the error message: ${error}`);
        };
    };


    return {
        // The functions that initially need to be run
        init: () => {
            displayCurrencies();
            setupEventListeners();  
        },

    }
    
})(CurrencyController, UIController)


//Run the initial functions
controller.init();
