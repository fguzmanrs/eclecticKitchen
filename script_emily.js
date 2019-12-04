    // https://api.spoonacular.com/recipes/findByIngredients
    // api keys: bb5452cb4b074d1a899410830c863f29
    // d0aef524cfc14d6ba3f35bc68ab620b9
    // 06238180649d43e0bffc9f3ac6536dc3


    var apiKey = "bb5452cb4b074d1a899410830c863f29"
    var ingredients = "tomato,butter,milk,cucumber,egg,sour cream"
    
    $.ajax({
        url: `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&number=10&ranking=1&ignorePantry=true&ingredients=${ingredients}`
    }).then(function(response){
        console.log(response);

    // title
    // usedIngredients, missedIngredients
    // image: data[i].image, data **312x231 => change to https://spoonacular.com/recipeImages/{ID}-636x393.{TYPE}
    // 
    })