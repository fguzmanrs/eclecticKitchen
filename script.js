// https://api.spoonacular.com/recipes/findByIngredients
// api keys: bb5452cb4b074d1a899410830c863f29
//           d0aef524cfc14d6ba3f35bc68ab620b9
//           06238180649d43e0bffc9f3ac6536dc3


var state = {
    searchIngredients: [],
    numOfRequest: 3, // how many recipe will you get from server? 1-100
    numOfRender: 1,
    rawData: [],
    recipes: [],
}


$('document').ready(function () {
    //var apiKey = "0421115dd3974c7f9338166f3e907824"; // Emily2
    //var apiKey = "f4abc8a8916747b3a3976addc1321ab0"; //birulaplanet.com
    //var apiKey = "d453036a9eeb46a1b474c7043973a767"; //xapienx
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

        // 1. Lender search list
        renderSearchList(inputIngredient);

        // 2. Save input to state data
        state.searchIngredients.push(inputIngredient);

        // 3. Save input data to local storage
        // saveToLocalStorage(inputIngredients);

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

        }
        else {
            // Need to change alert to modal or tooltip
            alert("Please add at least one ingredient.");
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

            recipesArr.push(recipeObj);
        }

        // Save the created array to state database
        state.recipes = recipesArr;
    }
    function renderRecipesList() {
        var li = "";
        $('#recipes').empty();

        for (var i = 0; i < state.numOfRender; i++) {
            // check for 'complete' recipe meaning: recipe with preparation steps 
            if (state.recipes[i].doRender === false) break;


            for (let j = 0; j < state.recipes[i].steps.length; ++j)
                li = li + "<li>" + state.recipes[i].steps[j] + "</li>"

                console.log(li);

            var recipeObj = state.recipes[i];
            var recipe = `<div class="recipe-card">
                            <div class="recipe">
                                <h2>${recipeObj.title}</h2>
                                <img class="recipe__image" src="${recipeObj.imgSmall}"></img>
                                <div class="recipe__detail">
                                <ul class="ingredients--used"></ul>
                                <ul class="ingredients--missed"></ul>
                                <ul class="instructions" hidden="hidden">${li}</ul>
                            </div>
                        </div>`

            $('#recipes').append(recipe);
            // console.log(recipeObj.usedIngredients, recipeObj.missedIngredients);

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

            // Delete the ingredient from state data
            var ingredient = li.attr('data-ingredient');
            var index = state.searchIngredients.indexOf(ingredient);
            state.searchIngredients.splice(index, 1);

            // Delete from DOM
            li.remove();
        }
    }
    function init() {
        // importFromLocalStorage()
    }
    function importFromLocalStorage() {

    }
    function saveToLocalStorage(str) {

        localStorage.setItem('ingredients', str);

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
    function clearSearchList() {
        $('#searchList').empty();
    }

    /**********************************/
    /*               EVENT            */
    /**********************************/

    $('#searchBtn').click(searchBtnHandler);
    $('#search-card').submit(addIngredientToList);
    $('#searchList').click(deleteIngredient);

    // ====================================
    // ffortizn
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


