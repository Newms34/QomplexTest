
const gold = 'https://render.guildwars2.com/file/090A980A96D39FD36FBB004903644C6DBEFB1FFB/156904.png',
    silver = 'https://render.guildwars2.com/file/E5A2197D78ECE4AE0349C8B3710D033D22DB0DA6/156907.png',
    copper = 'https://render.guildwars2.com/file/6CF8F96A3299CFC75D5CC90617C3C70331A1EF0E/156902.png';

Number.prototype.gw2Num = function () {
    let c = this % 100,
        s = ((this - c) % 10000)/100,
        g = (this - c - (s*100)) / 10000,
        str = '';
        if(!!g){
            str+=`${g}<img class='clipped-money' title='gold' src='${gold}'> `
        }
        if(!!s){
            str+=`${s}<img class='clipped-money' title='silver' src='${silver}'> `
        }
        if(!!c){
            str+=`${c}<img class='clipped-money' title='copper' src='${copper}'> `
        }
    return str;
}

const v = new Vue({
    data: {
        items: [],
        page: 1,
        lastPage: 1,
        searchTerm: '',
        includeUnsell: false,//should we include unsellables?
        searchStatus: 2,//0: searching, 1:found stuff, 2:nothing found
        bgImg: null,
        debounceTimer: null,
        loadingRecipes: false,
        recipeBox: {
            show: false,
            recipes: [],
        }
    },
    methods: {
        getBg() {
            //I'm using the specializations route because it offers a nice, painterly random background for the UI.
            let randomSp = Math.floor(Math.random() * 63) + 1;
            console.log('getting specialization', randomSp)
            fetch(`https://api.guildwars2.com/v2/specializations/` + randomSp)
                .then(r => r.json())
                .then(d => this.bgImg = d.background)
        },
        getSearchResults() {
            console.log('search string:', `/find?search=${this.searchTerm}&page=${this.page}${this.includeUnsell ? '&ius' : ''}`)
            fetch(`/find?search=${this.searchTerm}&page=${this.page}${this.includeUnsell ? '&ius' : ''}`).then(r => r.json()).then(d => {
                console.log(d)
                this.items = d.results;
                this.searchStatus = d.searchStatus;
                this.page = d.page;
                this.lastPage = d.lastPage;
            })
        },
        newSearch() {
            //new search, so first let's reset our max page and current page
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(async () => {
                this.searchStatus = 0;
                this.page = 1;
                this.items = [];
                this.getSearchResults();
            }, 500)
        },
        changePage(dir) {
            if (!dir && this.page > 1) {
                this.searchStatus = 0;
                this.items = [];
                this.page--;
                this.getSearchResults();
            } else if (!!dir && this.page < this.lastPage) {
                this.searchStatus = 0;
                this.items = [];
                this.page++;
                this.getSearchResults();
            }
        },
        async getRecipes(item, mode) {
            let recipResult = null,
                recipeUrl = `/recipes?id=${item.id}&type=`;
            this.loadingRecipes = true;
            this.recipeBox.show = true;
            if (!mode) {
                //get recipes where this item is the RESULT
                recipResult = await fetch(`${recipeUrl}result`).then(r => r.json());
            } else {
                //get recipes where this item is an INGREDIENT
                recipResult = await fetch(`${recipeUrl}ingredient`).then(r => r.json());
            }
            this.recipeBox.recipes = recipResult;
            if (!recipResult || !recipResult.length) {
                bulmabox.alert('No Recipes', `Sorry, but I can't find any recipes for <img src='${item.img}' class='tiny-img'> ${item.name} as ${(!mode ? 'a result' : 'an ingredient')}!`)
                this.recipeBox.show = false;
            }
            this.loadingRecipes = false;
        },
        profit(rec, isMax) {
            if (isMax) {
                return (rec.output.count * rec.output.buy) - rec.ingrs.reduce((a, c) => a + (c.sell * c.count), 0)
            }
            return (rec.output.count * rec.output.sell) - rec.ingrs.reduce((a, c) => a + (c.buy * c.count), 0)
        }
    },
    created() {
        this.getBg()
    },
    computed: {
        bgStyle() {
            return `background-color:#000; background-image:linear-gradient(transparent,#000),url('${this.bgImg}'); background-repeat: no-repeat; background-size:160% auto `
        }
    }
}).$mount('#main');


