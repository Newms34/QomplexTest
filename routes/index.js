const express = require('express'),
    axios = require('axios'),
    gw2spidy = `http://www.gw2spidy.com/api/v0.9/json/item-search/`,
    gw2items = `https://api.guildwars2.com/v2/items?ids=`,
    gw2recipeIds = `https://api.guildwars2.com/v2/recipes/search?`,
    gw2RecipeData = `https://api.guildwars2.com/v2/recipes?ids=`,
    gw2Prices = `http://api.guildwars2.com/v2/commerce/prices?ids=`,
    router = express.Router();

//DB stuff, if we want later!
// const mongoose = require('mongoose'),
//     models = require('../models');
// mongoose.Promise = Promise;
Array.prototype.union = function (otherArr) {
    return this.filter(q => !!otherArr.includes(q))
}

Array.prototype.chunk = function (groupsize) {
    const sets = [],
        chunks = this.length / groupsize;

    for (let i = 0, j = 0; i < chunks; i++, j += groupsize) {
        sets[i] = this.slice(j, j + groupsize);
    }

    return sets;
};
module.exports = function (io) {
    router.get('/find', async function (req, res, next) {
        if (!req.query.search || !req.query.page) {
            res.status(400).send('missingInfo')
        }
        //spidy stuff
        const out = {
            results: [],
            searchStatus: 2,//default to 2 (no items found)
            lastPage: 1,
            page: Number(req.query.page)
        }
        let spidy = await axios.get(gw2spidy + req.query.search + '/' + req.query.page);
        spidy = spidy.data;
        if (!spidy.results.length) {
            //nothing found!
            this.searchStatus = 2;
            this.items = [];
            return res.send(out);
        }
        let gw2Api = await axios.get(gw2items + spidy.results.map(q => q.data_id).join(','));
        out.results = gw2Api.data.filter(q => Object.keys(req.query).includes('ius') || !q.flags.union(['NoSell', 'AccountBoundOnAcquire', 'AccountBound', 'SoulbindOnAcquire']).length).map(m => {
            let spidyResult = spidy.results.find(q => q.data_id == m.id);
            return {
                sell: spidyResult.max_offer_unit_price,
                buy: spidyResult.min_sale_unit_price,
                id: m.id,
                name: m.name,
                img: m.icon
            };
        });
        out.searchStatus = out.results.length ? 1 : 2;
        out.lastPage = spidy.last_page;
        // console.log(gw2Api||'NO DATA!')

        res.send(out);
    });

    router.get('/recipes', async function (req, res, next) {
        if (!req.query.id || !req.query.type) {
            return res.status(400).send('missingInfo')
        }
        console.log('starting! id was', req.query.id)
        try {
            let isResult = req.query.type == 'result',
                recipRezUrl = gw2recipeIds + (isResult ? 'output' : 'input');
            let recipeIds = await axios.get(recipRezUrl + '=' + req.query.id);

            recipeIds = recipeIds.data;

            let recipeData = await axios.get(gw2RecipeData + recipeIds.join(','));
            recipeData = recipeData.data;
            //now we've got all recipes IDs involved with this item. 
            //next, we need to get the actual items either created or included
            let allInvolvedIds = [];
            recipeData.forEach(q => {
                allInvolvedIds = allInvolvedIds.concat(q.ingredients.map(s => s.item_id));
                allInvolvedIds.push(q.output_item_id)
            });


            allInvolvedIds = [req.query.id, ...new Set(allInvolvedIds)].chunk(20);//get all unique ids
            let allRecipePrices = await Promise.all(allInvolvedIds.map(q => axios.get(gw2Prices + q.join(',')))),
                allRecipeItems = await Promise.all(allInvolvedIds.map(q => axios.get(gw2items + q.join(','))));

            //convert to data
            allRecipePrices = allRecipePrices.map(q => q.data).flat(Infinity)
            allRecipeItems = allRecipeItems.map(q => q.data).flat(Infinity)

            const recipeList = recipeData.map(recipe => {
                let outItem = allRecipeItems.find(q => q.id == recipe.output_item_id),
                    outPrice = allRecipePrices.find(q => q.id == recipe.output_item_id);
                console.log('Recipe outpt item', outItem, '\n---and---\n', outPrice, '\n---and id was---\n', recipe.output_item_id)
                return {
                    output: {
                        id: outItem.id,
                        name: outItem.name,
                        img: outItem.icon,
                        count: recipe.output_item_count,
                        buy: (outPrice && outPrice.sells.unit_price) || 0,
                        sell: (outPrice && outPrice.buys.unit_price) || 0
                    },
                    ingrs: recipe.ingredients.map(ing => {
                        let ingItem = allRecipeItems.find(q => q.id == ing.item_id),
                            ingPrice = allRecipePrices.find(q => q.id == ing.item_id);
                        return ({
                            id: ingItem.id,
                            name: ingItem.name,
                            img: ingItem.icon,
                            count: ing.count,
                            buy: (ingPrice && ingPrice.sells.unit_price) || 0,
                            sell: (ingPrice && ingPrice.buys.unit_price) || 0
                        })
                    }),
                    disciplines: [...recipe.disciplines]
                }
            })
            res.send(recipeList)
        }
        catch(e){
            res.send([])
        }
    })
    router.get('*', function (req, res, next) {
        // console.log('trying to get main page!')
        res.sendFile('index.html', { root: './views' });
    });
    router.use(function (req, res) {
        res.status(404).end();
    });
    // console.log(router.stack.filter(r => r.route).map(r => r.route.path))
    return router;
};