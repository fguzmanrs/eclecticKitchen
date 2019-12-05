    // https://api.spoonacular.com/recipes/findByIngredients
    // api keys: bb5452cb4b074d1a899410830c863f29
    // d0aef524cfc14d6ba3f35bc68ab620b9
    // 06238180649d43e0bffc9f3ac6536dc3

var state ={
            numOfRequest: 10, // how many recipe will you get from server? 1-100
            // numOfRender: 3,
            rawData: [],
            // recipeIds:[],
            recipes: [],
            // currentRecipes : []
            }

$('document').ready(function(){

    var apiKey = "bb5452cb4b074d1a899410830c863f29"
    var ingredients = "tomato,butter,milk,cucumber,egg,sour cream"
    
    
    searchBtnHandler();

    /**********************************/
    /*           EVENT HANDLER        */
    /**********************************/

    async function searchBtnHandler(){

        await getRecipesFromAPI();
        console.log('raw data: ', state.rawData);
        
        // Take only necessary info from raw data and create each recipe {}. Then add it to one recipes [].
        createRecipesArr();
        console.log('recipes arr: ', state.recipes);
    }
    
    /**********************************/
    /*              API               */
    /**********************************/

    async function getRecipesFromAPI(){
        
        await $.ajax({
        
            url: `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&number=${state.numOfRequest}&ranking=1&ignorePantry=true&ingredients=${ingredients}`
        
        }).then(function(response){ state.rawData = response });
    
    }

    /**********************************/
    /*              FUNCTION          */
    /**********************************/

    function createRecipesArr(){
    
        var recipesArr = [];

        var l = state.rawData.length;
        for( var i=0; i < l ; i++){
        
            var rawRecipe = state.rawData[i];
            var recipeObj = {}; // format: { id: , title: , usedIng: , missedIng: , img: }
        
                // 1. add id, title, img to RecipeObj
                recipeObj.id = rawRecipe.id;
                recipeObj.title = rawRecipe.title;
                recipeObj.img = resizeImg(rawRecipe.image);

                // 2. add used ingredients arr to RecipeObj
                recipeObj.usedIngredients = createIngArr(rawRecipe.usedIngredients);
                
                // 3. add missed ingredients arr to RecipeObj
                recipeObj.missedIngredients = createIngArr(rawRecipe.missedIngredients);
            
            recipesArr.push(recipeObj);
        }

        // Save the created array to state database
        state.recipes = recipesArr;
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


// end
})
// Todo
    // duplicated ingredient element deleting function - done

    // image: data[i].image, data **312x231 => change to https://spoonacular.com/recipeImages/{ID}-636x393.{TYPE} - done

    // 2. Add an instruction property to each recipe {}. format: [step1,step2,step3...]

    // 3. recipe validator (*Pass only when it has instructions): return valid recipe arr
