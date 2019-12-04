    // https://api.spoonacular.com/recipes/findByIngredients
    // api keys: bb5452cb4b074d1a899410830c863f29
    // d0aef524cfc14d6ba3f35bc68ab620b9
    // 06238180649d43e0bffc9f3ac6536dc3

var state ={
            recipeArr: [],
            currentRecipe : {
                                id: null, // Francisco will need this id for detailed recipe
                                title:"",
                                usedIng: [],
                                missedIng: [],
                                img:""
                            }
            }

$('document').ready(function(){

    var apiKey = "bb5452cb4b074d1a899410830c863f29"
    var ingredients = "tomato,butter,milk,cucumber,egg,sour cream"
    
    $.ajax({
    
        url: `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&number=10&ranking=1&ignorePantry=true&ingredients=${ingredients}`
    
    }).then(function(response){

        console.log(response);
        state.recipeArr = response;

        var l = response.length;
        
        for( var i=0; i < l ; i++){

            var recipe = response[i];

            state.currentRecipe.id = recipe.id;
            state.currentRecipe.title = recipe.title;

           

            state.currentRecipe.img = recipe.image;

        }
        // add ing list arr
        createIngArr(state.currentRecipe.usedIng, recipe.usedIngredients);
        createIngArr(state.currentRecipe.missedIng, recipe.missedIngredients);
        console.log(state.currentRecipe.usedIng, state.currentRecipe.missedIng);

    // DATA NEEDED
    // title, usedIngredients, missedIngredients
    // image: data[i].image, data **312x231 => change to https://spoonacular.com/recipeImages/{ID}-636x393.{TYPE}

    // DATABASE NEED TO CHANGE to 3 main lists 
    })
})

function createIngArr(addTo, ingArr){
            
    var l = ingArr.length;

    for( var i =0 ; i < l ; i++ ){

        addTo.push(ingArr[i].name);

    }
}
   