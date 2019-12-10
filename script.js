
var state = {
    searchIngredients: [],
    numOfRequest: 10, // how many recipe will you get from server? 1-100
    numOfRender: 3,
    rawData: [],
    recipes: [],
    likes:[]
}


$('document').ready(function () {
    //var apiKey = " d0aef524cfc14d6ba3f35bc68ab620b9"; //FGuzman
    //var apiKey = "06238180649d43e0bffc9f3ac6536dc3"; //HCross
    //var apiKey = "5aac1a10cd874816809acc6f2d2fa006"; //FOrtiz
    //var apiKey = "bb5452cb4b074d1a899410830c863f29"; //Emily
    var apiKey = "d453036a9eeb46a1b474c7043973a767"; //xapienx.com
    //var apiKey = " f4abc8a8916747b3a3976addc1321ab0;" //birulaplanet.com
    //var apiKey = " 0421115dd3974c7f9338166f3e907824;" // Emily2

    /**********************************/
    /*           EVENT HANDLER        */
    /**********************************/

    function addIngredientToList(e) {

        e.preventDefault();

        var inputIngredient = $('#inputIng').val().trim(); console.log(inputIngredient);

        // Only proceed when the input is not duplicated
        if(state.searchIngredients.indexOf(inputIngredient) === -1){

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

            // Take only necessary info from raw data and create each recipe {}. Then add all recipes {}s to one [].
            createRecipesArr();

            // PASS2: validate/populate preparation steps into object
            for (var i = 0; i < state.recipes.length; ++i)
                await getInstructionsByRecipeId(state.recipes[i].id, i);

            // PASS3: Render recipes to DOM
            renderRecipesList();

//! ********* Inserted for temperary call to save API call
            // localStorage.setItem('tempRecipes', JSON.stringify(state.recipes));
//! **********************************************************
        }
        else {
            // Need to change alert to modal or tooltip
            alert("Please add at least one ingredient.");
        }

    }
    function favoriteMenuHandler(){
        // render
        console.log('hover')
        
    }
    function favoriteIconHandler(e){
        //

        if(e.target.matches('.icon, .icon *')){

            console.log('clicked', e.target);

            // Find which recipe is clicked
            var recipeHTML = $(e.target).closest('.recipe');
            var recipeIndex = recipeHTML.attr('data-recipe');
            var recipeObj = state.recipes[recipeIndex];

            // Toggle the recipe's property 'isLiked' value (true or false)
            recipeObj.isLiked = recipeObj.isLiked ? false : true;
            
            // render heart (toggle)
            console.log('finded: ', recipeHTML.find('use'));
            console.log("use's attr: ", recipeHTML.find('use').attr('xlink:href'));

            var useHTML = recipeHTML.find('use')
            var path = useHTML.attr('xlink:href').split('-')[2];
            
            useHTML.attr('xlink:href',`./assets/icons/sprite.svg#icon-heart-${ path === "plus" ? 'minus' : 'plus' }`)
            
  
            // save the likes to state data 
            if(recipeObj.isLiked){ // if isLiked === true
                state.likes.push(recipeObj);
                console.log('new like added: ', state.likes)
            }
            else{ // if isLiked === false

                var index = state.likes.findIndex(function(el){
                    return el.id === recipeObj.id
                })
                
                console.log('like index', index);

                    state.likes.splice(index, 1);
                    console.log('after spliced: ', state.likes);
                
            }
            // save the likes to local storage
            saveToLocalStorage('likes', state.likes);

        }
    }

    /**********************************/
    /*              API               */
    /**********************************/

    async function getRecipesByIngredients(ingredients) {

        await $.ajax({
            url: `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&number=${state.numOfRequest}&ranking=1&ignorePantry=true&ingredients=${ingredients}`,
            method: 'GET'
        })
            .then(function (response) { state.rawData = response })
            .catch(function (err) {

                // ** Need to change this alert to modal later
                alert('An error occured. Please try again later.');
                throw new Error("Unkown server error occured while getting recipes. The app has been stopped.");

            })

        if (state.rawData.length === 0) {
            // ** Need to change this alert to modal later
            alert('Cannot find any recipe with your input. Please make sure that you enter at least one valid ingredient.');
            throw new Error("No recipe returned. The app has been stopped.");
        }

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
        var li = "";
        $('#recipes').empty();

        for (var i = 0; i < state.numOfRender; i++) {
       
//! part to comment out when saving API call
            // check for 'complete' recipe meaning: recipe with preparation steps 
            if (state.recipes[i].doRender === false) break;

            // create preparation steps HTML
            for (let j = 0; j < state.recipes[i].steps.length; ++j)
                li += "<li>" + state.recipes[i].steps[j] + "</li>"
//! ******************************************************/

            var recipeObj = state.recipes[i];
            console.log('rendered recipe:', recipeObj.isLiked)
            var recipe = `<div class="row">
                            <div class="col s12 m7">
                                <div class="recipe" data-recipe="${i}">
                                    <h2>
                                        ${recipeObj.title}
                                        <span class="favoriteIcon">
                                            <svg class="icon">
                                                <use xlink:href="./assets/icons/sprite.svg#icon-heart-${recipeObj.isLiked ? 'minus' : 'plus'}" class="iconImg"></use>
                                            </svg>
                                        </span>
                                    </h2>
                                    <img class="recipe__image" src="${recipeObj.imgSmall}" data-recipe__image="recipe__image${i}">
                                    <span class="card-title"></span>
                                    <div class="recipe__detail" data-recipe__detail="recipe__detail${i}">
                                        <ul class="ingredients--used" data-ingredients--used="ingredients--used${i}"></ul>
                                        <ul class="ingredients--missed" data-ingredients--missed="ingredients--missed${i}"></ul>
                                        <ul class="instructions" hidden="hidden" data-instructions="instructions${i}">${li}</ul>
                                    </div>
                                </div>
                            </div>
                        </div>`

            $('#recipes').append(recipe);
            renderIngredients('.ingredients--used', i, recipeObj.usedIngredients);
            renderIngredients('.ingredients--missed', i, recipeObj.missedIngredients);
        }
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

        var li = `<li data-ingredient="${str}">
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

        importFromLocalStorage('ingredients', 'searchIngredients');
        importFromLocalStorage('likes', 'likes');

        // Render stored search list to DOM
        var l = state.searchIngredients.length;

        if(l>0){
            for(var i=0 ; i<l ; i++){
                renderSearchList(state.searchIngredients[i]);
            }
        }

//! Inserted for Temperary code to save API call 
        // var loadedData = localStorage.getItem('tempRecipes');
        // // console.log('loadedData: ', loadedData)
        // if(loadedData){
        //     state.recipes = JSON.parse(loadedData);
        //     renderRecipesList();
        // }
//! ***********************************************************        
    }
    function importFromLocalStorage(item,addTo) {

        var loadedData = localStorage.getItem(item);

        if(loadedData){
            state[addTo] = JSON.parse(loadedData);
        }
    }
    function saveToLocalStorage(addTo,data) {

        // var duplicateDeletedArr = Array.from(new Set(data));
        localStorage.setItem(addTo, JSON.stringify(data));

    }
    function isLikedOrNot(obj){

        var likedIds = state.likes.map(function(el){ return el.id });

        // if obj has the same id of likedIds obj, return true
        console.log(likedIds, obj.id);
        var index = likedIds.indexOf(obj.id);
        
        return index === -1 ? false : true;
        
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
    $('#favoriteMenu').mouseenter(favoriteMenuHandler);

    // Each recipe's favorite button
    $('#recipes').click(favoriteIconHandler);

    // ====================================
    // ffortizn
    
    document.addEventListener('DOMContentLoaded', function() {
        var elems = document.querySelectorAll('.modal');
        var instances = M.Modal.init(elems, options);
      });
    
    
    // PASS 2: Validate against preparation steps (note empty)
    // if not empty then populate preparation steps on object
    async function getInstructionsByRecipeId(recipeId, k) {
        var arr = [];
        console.log("apiKey: " + apiKey);
        var queryURL = `https://api.spoonacular.com/recipes/${recipeId}/analyzedInstructions?apiKey=${apiKey}`;

        await $.ajax({
            url: queryURL,
            method: "GET"
        }).then(function (data) {
            //console.log("instructions raw data:", data);
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
            //console.log("ff" + state.recipes[k].steps);
            //return arr;
        });
    }

    $('.modal').modal();
    init();


    /********************** end **************************/
})
// Todo
    // ajax : getting data - done
    // duplicated ingredient element deleting function - done
    // image: data[i].image, data **312x231 => change to https://spoonacular.com/recipeImages/{ID}-636x393.{TYPE} - done
    // render to DOM - done
    // render used ingredients and missing ingredients to DOM - done
    // render input list to DOM - done
    // Add an instruction property to each recipe {}. format: [step1,step2,step3...] - Francisco - done

    // used & missed ingredients accuracy matter : chocolate !== semi-sweet chocolate, dark chocolate candy bars... 

    // recipe validator (*Pass only when it has instructions, less than 10 missing ingredient?)
    // change alert to modal
    // loader animation


