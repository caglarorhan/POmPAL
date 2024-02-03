import cities from '../json/cities.json' assert {type: 'json'};

let POmPAL = {
    // TODO: il isminden hareketle https://www.petrolofisi.com.tr/akaryakit-fiyatlari/zonguldak-akaryakit-fiyatlari seklinde il ve ilce fiyatlarinin oldugu sayfa cekilecek
    // TODO kullanici selectbox dan il secip sonra gelen ilceden sececek ve bu il-ilce ikilisini kaydedecek


    poTargetCityPriceDataPageRootURL:`https://www.petrolofisi.com.tr/akaryakit-fiyatlari`,
    poSearchPageURL:'https://www.petrolofisi.com.tr/Fuel/Search',
    locationsSelectionPartId: 'locationSelection',
    locationSelectionCitiesSelectId: 'citySelection',
    locationSelectionCountySelectId: 'countySelection',
    activeState:{
        targetSelections: []
    },
    autoSaveTime:10,
    init(){
        this.storageToState();
        this.autoSave();
        this.getLocations().then(r=>r);
        let tabsElm = document.querySelectorAll('.tabs');
        let tabsInstance = M.Tabs.init(tabsElm, {});
        this.getGasPrices();
        this.prepareCityDeSelection();
    },
    async getLocations(){
        let selectionPart = document.getElementById(this.locationsSelectionPartId);
        let citySelect = document.createElement('select');
        citySelect.id = this.locationSelectionCitiesSelectId;
        selectionPart.appendChild(citySelect);
        let newOpt = document.createElement('option');
        newOpt.value = "";
        newOpt.text = "Select a City";
        newOpt.disabled=true;
        newOpt.selected = true;
        citySelect.appendChild(newOpt);
        Object.keys(cities).forEach(key=>{
            let newOpt = document.createElement('option');
            newOpt.value = cities[key].plateCode;
            newOpt.text = cities[key].cityName;
            citySelect.appendChild(newOpt);
        })

        let elems = document.querySelectorAll('select');
        let selectInstances = M.FormSelect.init(elems, {});
        citySelect.addEventListener('change',this.getCounties.bind(this));
    },
    async getCounties(event){
        let cityPlateCode = event.target.value;
        //console.log(`${this.poSearchPageURL}?template=1&cityId=${cityPlateCode}`);
        let response = await fetch(`${this.poSearchPageURL}?template=1&cityId=${cityPlateCode}`, {method: 'POST'});
        let tempHTML = await response.text();
        let dP = new DOMParser();
        let doc = dP.parseFromString(tempHTML, "text/html");
        let counties = [...doc.querySelectorAll('.table-prices tr td:first-child')].map((item)=>item.textContent);
        //console.log(counties);
        let selectionPart = document.getElementById(this.locationsSelectionPartId);
        let countySelect;
        if(!selectionPart.querySelector(`#${this.locationSelectionCountySelectId}`)){
            countySelect = document.createElement('select');
            countySelect.id = this.locationSelectionCountySelectId;
            selectionPart.appendChild(countySelect);
        }else{
            // TODO:  il degisince ilce guncellenmeli BUG VAR
        }
        counties.forEach(county=>{
            let newOpt = document.createElement('option');
            newOpt.value = county;
            newOpt.text = county;
            countySelect.appendChild(newOpt);
        })
        let elems = document.querySelectorAll('select');
        let selectInstances = M.FormSelect.init(elems, {});
        countySelect.addEventListener('change',()=>{
            if(countySelect.value){
                if(!selectionPart.querySelector('#targetCountySaveButton')){
                    let saveButton = document.createElement('button');
                    saveButton.classList.add('waves-effect', 'waves-light', 'btn');
                    saveButton.id='targetCountySaveButton';
                    saveButton.textContent='SAVE';
                    selectionPart.appendChild(saveButton);
                    saveButton.addEventListener('click',this.setLocations.bind(this));
                }

            }else{
                //dugmeyi sil
            }
        })
    },
    setLocations(){
        let selectionPart = document.getElementById(this.locationsSelectionPartId);
        let citySelect = selectionPart.querySelector(`#${this.locationSelectionCitiesSelectId}`);
        let countySelect = selectionPart.querySelector(`#${this.locationSelectionCountySelectId}`);
        this.activeState.targetSelections.push({plateCode:citySelect.value, countyName:countySelect.value});
        this.saveTheState();
        this.prepareCityDeSelection();
        this.getGasPrices();
    },
    storageToState() {
        if (localStorage.getItem("activeState") && localStorage.getItem("activeState") !== 'null') {
            this.activeState = JSON.parse(localStorage.getItem("activeState"));
        }
    },
    stateToStorage() {
        localStorage.setItem("activeState", JSON.stringify(this.activeState));
    },
    saveTheState() {
        this.stateToStorage();
    },
    autoSave() {
        setInterval(this.saveTheState.bind(this), this.autoSaveTime * 1000);
    },
    getGasPrices(){
        let gasPrices =document.getElementById("selectedCountyPrices");
        gasPrices.innerHTML=this.getTemplate["gasPriceInfoTemplate"]();

        this.activeState.targetSelections.forEach((target, index)=>{
            gasPrices.innerHTML+= this.getTemplate["progressBar"](`progressBar_${target.plateCode}`);
            this.retrieveCityPriceData({plateCode:target.plateCode, countyName:target.countyName}).then(data=>{
                let cityName = cities[`plate_`+target.plateCode].cityName;
                gasPrices.querySelector(`#progressBar_${target.plateCode}`).remove();
                gasPrices.innerHTML+= this.getTemplate['gasPriceInfoTemplate']({cityName: cityName, countyName:target.countyName,gasPriceData:data, priceUnitSign:'TL'})
                this.activeState.targetSelections[index].data = data;
            })

        })

    },
    async retrieveCityPriceData(dataObj={plateCode:'01', countyName:'CEYHAN'}){
        // TODO: SAdece PO ya gore hazirlandi diger sirketlerin sayfa yapisi incelenip onlara gore de uyarlanmali.
        const params = new URLSearchParams();
        params.append('cityId', dataObj.plateCode);
        params.append('template', '1');
        const fullUrl = this.poSearchPageURL + '?' + params.toString();
        const options = {
            method: 'POST'
        };
        let response = await fetch(fullUrl,options);
        let tempHTML = await response.text();
        let dP = new DOMParser();
        let doc = dP.parseFromString(tempHTML, "text/html");
        let tableRows = [...doc.querySelectorAll('.table-prices tr')];
        let tags = [...tableRows[0].querySelectorAll('th:not(:first-child)')].map(eachTh=>eachTh.textContent);
        let targetCountyTr = tableRows.filter(countyTr=>{
            //console.log(countyTr);
            if(countyTr.querySelector('td:nth-of-type(1)') && countyTr.querySelector('td:nth-of-type(1)').textContent===dataObj.countyName) return true;
        });
        let gasPrices = [...targetCountyTr[0].querySelectorAll('td span:nth-of-type(1)')].map(eachTd=>eachTd.textContent);

        return {tags:tags, prices:gasPrices, date:new Date().getTime()};
    },
    prepareCityDeSelection(){
        let cityDeSelection = document.getElementById('cityDeSelection');
        cityDeSelection.innerHTML='';
        cityDeSelection.innerHTML+= this.getTemplate["cityDeSelection"]();
        this.activeState.targetSelections.forEach(({plateCode,countyName})=>{
            let cityName = cities["plate_"+plateCode].cityName;
            cityDeSelection.innerHTML+= this.getTemplate["cityDeSelection"]({plateCode:plateCode, cityName:cityName, countyName:countyName})
        })
        cityDeSelection.querySelectorAll('.deselect-btn').forEach(theBtn=>{
            theBtn.addEventListener('click',(event)=>{
                let plateCode = event.target.dataset.county.split('_')[0];
                let countyName = event.target.dataset.county.split('_')[1];
                let targetIndex = this.activeState.targetSelections.findIndex(item=> item.plateCode === plateCode && item.countyName === countyName);
                this.activeState.targetSelections.splice(targetIndex, 1);
                theBtn.parentNode.parentNode.remove();
                this.getGasPrices();
            })
        })
    },
    getTemplate:{
        "gasPriceInfoTemplate":(dataObj={cityName:'City Name', countyName:'County Name',gasPriceData:'Prices', priceUnitSign:'TL'})=>{
            let allPrices = '<div class="allPrices">';
            if(dataObj.gasPriceData!=='Prices'){
                allPrices+=`<div class="tags">`;
                dataObj.gasPriceData.tags.forEach(tag=>{
                    allPrices+=`<div>${tag}</div>`;
                })
                allPrices+=`</div>`;
                allPrices+=`<div class="prices-detail">`;
                dataObj.gasPriceData.prices.forEach(price=>{
                    allPrices+=`<div>${price}</div>`;
                })
                allPrices+=`</div>`;
            }else{
                allPrices+=`${dataObj.gasPriceData}</div>`;
            }
            return`
                    <div class="gas-prices">
                        <div class="city-name">${dataObj.cityName}</div>
                        <div class="county-name">${dataObj.countyName}</div>
                        <div class="prices">${allPrices}</div>
                    </div>    
                    `;
        },
        "progressBar" :(tempId)=>{
            return `<div class="progress" id="${tempId}"><div class="indeterminate"></div></div>`
        },
        "cityDeSelection":(dataObj={plateCode:'Plate Code', cityName:'City', countyName:'County'})=>{
            let tempResult = '';
            if(dataObj.plateCode === 'Plate Code'){
                tempResult =`<div class="deselect"><b>${dataObj.cityName}</b>  (${dataObj.plateCode})   ${dataObj.countyName}</div>`;
            }else{
                tempResult = `
                <div class="deselect">
                <div><b>${dataObj.cityName}</b></div>
                <div>(${dataObj.plateCode})</div>
                <div>${dataObj.countyName}</div>
                <div><button class="deselect-btn waves-effect waves-light btn-small" data-county="${dataObj.plateCode}_${dataObj.countyName}">DeSelect</button></div>
                
                </div>
            `;

            }
            return tempResult;
        }
    }
}

window.addEventListener('load',()=>{
    POmPAL.init();

})

