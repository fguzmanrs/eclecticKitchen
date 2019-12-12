
var state = {
    searchIngredients: [],
    numOfRequest: 10, //how many recipe to get from server? (1-100)
    numOfRender: 3, //how many recipe to render to DOM
    rawData: [],
    recipes: [],
    likes: [],
    currentModal: null,
    currentCollap: null
}


$('document').ready(function () {

    // var apiKey = "d0aef524cfc14d6ba3f35bc68ab620b9"; //FGuzman
    // var apiKey = "06238180649d43e0bffc9f3ac6536dc3"; //HCross
    var apiKey = "5aac1a10cd874816809acc6f2d2fa006"; //FOrtiz
    // var apiKey = "bb5452cb4b074d1a899410830c863f29"; //Emily
    // var apiKey = "d453036a9eeb46a1b474c7043973a767"; //xapienx.com
    // var apiKey = "f4abc8a8916747b3a3976addc1321ab0"; //birulaplanet.com
    // var apiKey = "0421115dd3974c7f9338166f3e907824"; //Emily2

    /**********************************/
    /*           EVENT HANDLER        */
    /**********************************/

    function addIngredientToList(e) {

        e.preventDefault();

        var inputIngredient = $('#inputIng').val().trim(); console.log(inputIngredient);

        // Proceed only when the input is not duplicated
        if (state.searchIngredients.indexOf(inputIngredient) === -1) {

            // 1. Lender search list
            renderSearchList(inputIngredient);

            // 2. Save input to state data
            state.searchIngredients.push(inputIngredient);

            // 3. Save input data to local storage
            saveToLocalStorage('ingredients', state.searchIngredients);
        }

        // 4. Clear input text
        $('#inputIng').val("");

    }
    async function searchBtnHandler(e) {

        e.preventDefault();

        if (state.searchIngredients.length > 0) {

            await getRecipesByIngredients(state.searchIngredients);

            // Take only necessary info from raw data and create each recipe obj. Then add all recipe objs to one arr.
            createRecipesArr();

            // animation for waiting
            $('#recipes').empty();
            var waiting = `<div class="row">
                            <br><br><br><br>
                            <div class="progress">
                               <div class="indeterminate"></div>
                            </div>
                        </div>`

            $('#recipes').append(waiting);

            // PASS2: validate/populate preparation steps into object
            for (var i = 0; i < state.recipes.length; ++i)
                await getInstructionsByRecipeId(state.recipes[i].id, i);

            // PASS3: Render recipes to DOM
            renderRecipesList();

            //! [For Test] Insert for render test when API keys run out.(saving search result)
            localStorage.setItem('tempRecipes', JSON.stringify(state.recipes));
            //! **********************************************************
        }
        else {

            var message = "No ingredient entered! Please add at least one ingredient to search recipes.";
            errorAlertModal(message);

        }

    }
    function favoriteMenuHandler() {

        var l = state.likes.length;

        $('#modal-list').empty();

        // Render favorite recipe list
        if (l > 0) {
            var list = "";

            for (var i = 0; i < l; i++) {

                var like = state.likes[i];

                list += `<li class="favorite__list">
                            <a href="#${i}">
                                <img src="${like.imgSmall}" class="favorite__img">
                                <div>
                                    <h6 class="favorite__title">${like.title}</h6>
                                    <p class="favorite__ing">Used ingredients: ${like.usedIngredients}</p>
                                </div>
                            </a>
                        </li>`
            }

        }
        else {
            var list = '<h6> There is no favorite added.</h6>'
        }

        $('#modal-list').append(list);

        state.currentModal = M.Modal.getInstance(document.querySelector('#modal-favorite'));
        state.currentModal.open();

    }
    function gotoFavoriteHandler(e) {
        
        // When favorite recipe is clicked
        if(e.target.matches('.favorite__list, .favorite__list *')){

            $('#recipes').empty();

            if(state.currentModal){

                // Find which recipe is clicked
                var index = e.target.closest('a').getAttribute('href').slice(1);

                // Render that recipe to DOM
                renderRecipe(state.likes[index]);

                // Close modal
                state.currentModal.close();
            }
        }
    }
    function favoriteIconHandler(e) {

        // If heart icon is clicked
        if (e.target.matches('.icon, .icon *')) {

            // 1. Find which recipe is clicked
            var recipeHTML = $(e.target).closest('.recipe');
            var recipeIndex = recipeHTML.attr('data-recipe');
            var recipeObj = state.recipes[recipeIndex];

            // 2. Toggle the recipe's property 'isLiked' value (true or false)
            recipeObj.isLiked = recipeObj.isLiked ? false : true;

            // 3. Toggle heart icone +,- shape
            var useHTML = recipeHTML.find('use');
            var path = useHTML.attr('xlink:href').split('-')[2];

            useHTML.attr('xlink:href', `./assets/icons/sprite.svg#icon-heart-${path === "plus" ? 'minus' : 'plus'}`);


            // 4. Save likes to state data 

            if (recipeObj.isLiked) { // if isLiked === true

                state.likes.push(recipeObj); console.log('new like obj added: ', state.likes);

            }
            else { // if isLiked === false

                var index = state.likes.findIndex(function (el) {
                    return el.id === recipeObj.id;
                })

                state.likes.splice(index, 1); 
                console.log('updated like obj after deleting: ', state.likes);

            }

            // 5. Save likes to local storage
            saveToLocalStorage('likes', state.likes);

        }
    }

    /**********************************/
    /*              APIs              */
    /**********************************/

    async function getRecipesByIngredients(ingredients) {

        await $.ajax({
            url: `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&number=${state.numOfRequest}&ranking=1&ignorePantry=true&ingredients=${ingredients}`,
            method: 'GET'
        })
            .then(function (response) { state.rawData = response })
            .catch(function (err) {

                var message = "An error occured while geting recipes from server. Please try again later.";
                errorAlertModal(message);

                throw new Error("🚧 Unkown server error occured while getting recipes. The app is stopped.");

            })

        if (state.rawData.length === 0) {

            var message = "We cannot find any recipe with your ingredient. Please make sure that you enter at least one valid ingredient.";
            errorAlertModal(message);

            throw new Error("🚧 No recipe returned. The app is stopped.");

        }

    }
    async function getInstructionsByRecipeId(recipeId, k) {
        // PASS 2: Validate against preparation steps (note empty)
        // if not empty then populate preparation steps on object
        var arr = [];
        console.log("apiKey: " + apiKey);
        var queryURL = `https://api.spoonacular.com/recipes/${recipeId}/analyzedInstructions?apiKey=${apiKey}`;

        await $.ajax({
            url: queryURL,
            method: "GET"
        }).then(function (data) {

            var i, j;

            // Traverse steps on response and push in an array, then return array
            for (i = 0; i < data.length; ++i)
                for (j = 0; j < data[i].steps.length; ++j)
                    arr.push(data[i].steps[j].step);

            // PASS2 : Validate/Populate
            // Implement try/catch (maybe?)

            // VALIDATE
            // if no steps then doRender = False (do not render in next step)

            state.recipes[k].doRender = false;

            if (arr.length > 0) {
                // Response has data then populate object
                state.recipes[k].steps = arr;
                // Preparation steps found, set render flag to true
                state.recipes[k].doRender = true;
            }

        });
    }

    /**********************************/
    /*              FUNCTION          */
    /**********************************/

    function createRecipesArr() {

        var recipesArr = [];

        var l = state.rawData.length;
        for (var i = 0; i < l; i++) {

            var rawRecipe = state.rawData[i];
            var recipeObj = {}; // format: { id: , title: , usedIng: , missedIng: , imgSmall: ,imgLarge: }

            // 1. add id, title, img to RecipeObj
            recipeObj.id = rawRecipe.id;
            recipeObj.title = rawRecipe.title;
            recipeObj.imgSmall = rawRecipe.image;
            recipeObj.imgLarge = resizeImg(rawRecipe.image);

            // 2. add used ingredients arr to RecipeObj
            recipeObj.usedIngredients = createIngArr(rawRecipe.usedIngredients);

            // 3. add missed ingredients arr to RecipeObj
            recipeObj.missedIngredients = createIngArr(rawRecipe.missedIngredients);

            // 4. add like factor
            recipeObj.isLiked = isLikedOrNot(recipeObj);

            recipesArr.push(recipeObj);
        }

        // Save the created array to state database
        state.recipes = recipesArr;
    }
    function renderRecipesList() {

        $('#recipes').empty();

        for (var i = 0; i < state.numOfRender; i++) {

            var recipeObj = state.recipes[i];

            renderRecipe(recipeObj, i);

        }
    }
    function renderRecipe(obj, i = 0) {
 
        // check for 'complete' recipe meaning: recipe with preparation steps 
        if (obj.doRender === false) return;

        // create preparation steps HTML
        var li = "";
        for (let j = 0; j < obj.steps.length; ++j)
            li += `<br>${j+1}. ${obj.steps[j]}<br>`;

            var recipe = `<div class="row">
                            <div class="col">
                                
                                <div class="recipe card" data-recipe="${i}">
                                    <div class="card-image">
                                        <img class="recipe__image" src="${obj.imgLarge}" data-recipe__image="recipe__image${i}">
                                        <span class="card-title"></span>
                                        <a class="btn-floating halfway-fab waves-effect waves-light red"><i class="material-icons">+</i></a>
                                    </div>
                                    <div class="recipe__detail card-content" data-recipe__detail="recipe__detail${i}">
                                        <h5>
                                            ${obj.title}
                                            <span class="favoriteIcon">
                                                <svg class="icon">
                                                    <use xlink:href="./assets/icons/sprite.svg#icon-heart-${obj.isLiked ? 'minus' : 'plus'}" class="iconImg"></use>
                                                </svg>
                                            </span>
                                        </h5>
                                        <ul class="ingredients--used"></ul>
                                        <ul class="ingredients--missed"></ul>
                                        <ul class="instructions collapsible" data-instructions=${i}>
                                            <li>
                                                <div class="collapsible-header">
                                                    Preparation
                                                </div>
                                                <div class="collapsible-body">
                                                    <p>${li}</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div> 
                                </div>

                            </div>
                        </div>`

        $('#recipes').append(recipe);
        renderIngredients('.ingredients--used', i, obj.usedIngredients);
        renderIngredients('.ingredients--missed', i, obj.missedIngredients);

        // Materialize Collapsible init
        $('.collapsible').collapsible();
    }
    function renderIngredients(addTo, order, arr) {

        var l = arr.length;

        if (l > 0) {

            var list = "";

            for (var i = 0; i < l; i++) {
                list = list + `<li>${arr[i]}</li>`;
            }

            $(`${addTo}`).eq(order).append(list);
        }

    }
    function renderSearchList(str) {

        var li = `<li class="collection" data-ingredient="${str}">
                    ${str}
                    <span class="delete"> &#215; </span>
                  </li>`;

        $('#searchList').append(li);

    }
    function deleteIngredient(e) {

        if (e.target.matches('span[class=delete]')) {

            var li = $(e.target).closest('li');

            // Delete the ingredient from state data & local storage
            var ingredient = li.attr('data-ingredient');
            var index = state.searchIngredients.indexOf(ingredient);

            state.searchIngredients.splice(index, 1);
            saveToLocalStorage('ingredients', state.searchIngredients);

            // Delete from DOM
            li.remove();

        }
    }
    function init() {
        
        // Initiate all Materialize components
        M.AutoInit();

        // Load from local storage
        importFromLocalStorage('ingredients', 'searchIngredients');
        importFromLocalStorage('likes', 'likes');

        // Render stored search list to DOM
        var l = state.searchIngredients.length;

        if (l > 0) {
            for (var i = 0; i < l; i++) {
                renderSearchList(state.searchIngredients[i]);
            }
        }

        //![For Test] Insert for render test when API keys run out.(saving search result)
        var loadedData = localStorage.getItem('tempRecipes');

        if(loadedData){
            state.recipes = JSON.parse(loadedData);
            renderRecipesList();
        }
        //! ***********************************************************        
    }
    function importFromLocalStorage(item, addTo) {

        var loadedData = localStorage.getItem(item);

        if (loadedData) {
            state[addTo] = JSON.parse(loadedData);
        }
    }
    function saveToLocalStorage(addTo, data) {

        // var duplicateDeletedArr = Array.from(new Set(data));
        localStorage.setItem(addTo, JSON.stringify(data));

    }
    function isLikedOrNot(obj) {

        var likedIds = state.likes.map(function (el) { return el.id });

        // If obj has the same id of likedIds obj, return true
        var index = likedIds.indexOf(obj.id);

        return index === -1 ? false : true;

    }
    function errorAlertModal(message){

        var instance = M.Modal.getInstance(document.querySelector('#modal-alert'));
        
        $('#modal-message').text(message);
        instance.open();

    }
    /**********************************/
    /*              UTILITY           */
    /**********************************/

    // Take only ingredient's NAME property
    function createIngArr(ingArr) {

        var newArr = ingArr.map(function (el) { return el.name });

        // delete duplicated elements
        newArr = Array.from(new Set(newArr));

        return newArr;
    }
    function resizeImg(str) {

        // Change default size(312x231) to max-size(636x393)
        return str.replace("312x231", "636x393");

    }

    /**********************************/
    /*               EVENT            */
    /**********************************/

    $('#searchBtn').click(searchBtnHandler);
    $('#search-card').submit(addIngredientToList);
    $('#searchList').click(deleteIngredient);

    // Favorite menu button
    $('#favoriteMenu').on('click', favoriteMenuHandler);
    $('#modal-list').on('click', gotoFavoriteHandler);

    // Each recipe's favorite button
    $('#recipes').click(favoriteIconHandler);

    init();

});


