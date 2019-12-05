    // https://api.spoonacular.com/recipes/findByIngredients
    // api keys: bb5452cb4b074d1a899410830c863f29
    //           d0aef524cfc14d6ba3f35bc68ab620b9
    //           06238180649d43e0bffc9f3ac6536dc3

var state ={
            numOfRequest: 10, // how many recipe will you get from server? 1-100
            numOfRender: 3,
            rawData: [],
            recipes: [],
            }

$('document').ready(function(){

    var apiKey = "bb5452cb4b074d1a899410830c863f29"
    // var ingredients = "tomato,butter,milk,cucumber,egg,sour cream"
    
    // searchBtnHandler();

    /**********************************/
    /*           EVENT HANDLER        */
    /**********************************/

    async function searchBtnHandler(e){
        
        e.preventDefault();
        
        var inputIngredients = $('#inputIng').val().trim();
        console.log(inputIngredients);
        
        if(inputIngredients){

            await getRecipesFromAPI(inputIngredients);
            console.log('raw data: ', state.rawData);
            
            // Take only necessary info from raw data and create each recipe {}. Then add all recipes {}s to one [].
            createRecipesArr();
            console.log('recipes arr: ', state.recipes);

        }else{
            // ** Need to change this alert to modal later
            alert('Please enter at least one valid ingredient.');
            
        }
        
        // Render recipes to DOM
        renderRecipesList();
    }
    
    /**********************************/
    /*              API               */
    /**********************************/

    async function getRecipesFromAPI(ingredients){
        
        await $.ajax({
                        url: `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&number=${state.numOfRequest}&ranking=1&ignorePantry=true&ingredients=${ingredients}`,
                        method: 'GET'
                    })
                .then(function(response){ state.rawData = response })
                .catch(function(err){

                    // ** Need to change this alert to modal later
                    alert('An error occured. Please try again later.');
                    throw new Error("Unkown server error occured while getting recipes.");

                })

        if(state.rawData.length === 0){
            // ** Need to change this alert to modal later
            alert('Please enter at least one valid ingredient.');
        }
    
    }

    /**********************************/
    /*              FUNCTION          */
    /**********************************/

    function createRecipesArr(){
    
        var recipesArr = [];

        var l = state.rawData.length;
        for( var i=0; i < l ; i++){
        
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
    function renderRecipesList(){

        for( var i=0 ; i<state.numOfRender ; i++ ) {
            
            var recipeObj = state.recipes[i];

            var html = `<div class="recipe-card" id="recipe">
                            <h2>${recipeObj.title}</h2>
                            <img id="recipe-image" src="${recipeObj.imgSmall}"></img>
                        </div>`

            $('#recipes').append(html);
            
        }
        
    }
    /**********************************/
    /*              UTILITY           */
    /**********************************/

    // Take only ingredient's NAME property
    function createIngArr(ingArr){ 

        var newArr = ingArr.map( function(el){ return el.name });
            
            // delete duplicated elements
            newArr = Array.from(new Set(newArr));
        
        return newArr;
    }

    function resizeImg(str){

        // Change default size(312x231) to max-size(636x393)
        return str.replace("312x231", "636x393");

    }

    /**********************************/
    /*               EVENT            */
    /**********************************/

    $('#searchBtn').click(searchBtnHandler);



// end
})
// Todo
    // ajax : getting data - done
    // duplicated ingredient element deleting function - done
    // image: data[i].image, data **312x231 => change to https://spoonacular.com/recipeImages/{ID}-636x393.{TYPE} - done
    // render to DOM - done

    // 1. render input list to DOM
    // 2. Add an instruction property to each recipe {}. format: [step1,step2,step3...]
    // 3. recipe validator (*Pass only when it has instructions): return valid recipe arr
    // 4. change alert to modal
