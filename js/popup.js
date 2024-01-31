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
    async getGasPrices(){
        let response = await fetch(this.poTargetCityPriceDataPageRootURL);
        let tempHTML = await response.text();
        let dP = new DOMParser();
        let doc = dP.parseFromString(tempHTML, "text/html");
        let cities = [...doc.querySelectorAll('.table-prices tr td:first-child')].map((item)=>item.textContent);
    }
}

window.addEventListener('load',()=>{
    POmPAL.init();

})

