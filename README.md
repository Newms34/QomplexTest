# QOMPLEX API Test

For my API Test, I chose to *mainly* use the Guild Wars 2 API from the MMO Guild Wars 2, by ArenaNet, LLC. I chose this because as far as APIs go, this is honestly one of the cleaner and easier-to use ones I've seen. I also suplmented it with the gw2spidy API (for reasons outlined below)

The APIs have a lot of different subroutes (especially the Guild Wars 2 API!), and I've listed the ones I'm using below


---

### External API Routes
I'm using the following Guild Wars 2 API routes in this app:

 - `/items?ids=` - Obtain information about particular in-game items, such as max/min price, name, the item's ingame icon, and so on. Accepts a comma-delineated list of item ids.
 - `/recipes/search` - given an item, find all in game crafting formulae ("recipes") that *either* use this item as an ingredient *or* produce this item as a result. Note that not all items will be 'involved' in recipes! Accepts either an `input=` or an `output=` parameter, and a single item id.
 - `/recipes?ids=` - Give information about particular recipes, given their ids. Accepts a comma-delineated list of recipe ids.
 - `/commerce/prices?ids=` - Returns current market data for particular items, given their IDs. Accepts a comma-delineated list of item ids.
 
Because the official Guild Wars 2 API does *not* have an "item search" feature (e.g., there's no explicit way to search for `"iron ingot"` and have it tell me that the item id for that item is `19683`), I decided to use a separate, third-party API to obtain these data. The gw2spidy.com api exposes the following endpoint:
 - `/v0.9/json/item-search/` - Given a search string, produces an array of possible results.

---

### Usage:
Using the app is pretty easy:
1. Enter a term in the `Item Search` box. 
2. Wait for results to show up!
3. If you get results (i.e., your term found some stuff), click either `Result` or `Ingredient` to get recipes for that item.
4. The listed profits are calculated as a difference between the maximum sell price of the recipe result minus the minimum buy price of the recipe ingredients and the minimum sell price of the recipe result minus the maximum buy price of the recipe ingredients. In other words, the highest profit you can make and the lowest profit you can make
5. Close the Recipes box if you'd like to search for another item

---

### Included Frameworks/Libraries
I've included/used the following notable frameworks/libraries:
 - **Bulma**: For front-end CSS. I picked this over Bootstrap so that we don't have to include a billion jQuery dependencies and all that.
 - **Bulmabox**: My own personal library I wrote a while ago. It's in the style of Bootstrap's [Bootbox](bootboxjs.com). Both are extensions/replacements for the vanilla front-end dialog box system. Basically: They make `alert()`ing on the front-end less ugly.
 - **VueJS**: Front-end MVVM Framework. Mainly used here to render the item lists and interact with Bulma
 - **NodeJS**: Backend Runtime.
 - **ExpressJS**: Web server framework.
 - **Gulp**: For minifying/uglifying/concatenating stuff.

---

### Other Notes:
While the list at https://github.com/public-apis/public-apis#jobs claims that the Guild Wars 2 API requires an API key, this is actually only true for subroutes that expose account-specific information, such as character names, account age, play time, etc. Data that are publically available to everyone, such as market data, do *not* require an API key.

Were I to work on this more, I'd have the recipe lists sorted automatically by highest to lowest profit.

Oh, and you can view the app deployed over at dave-qomplex-test.herokuapp.com. 