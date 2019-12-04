$(document).ready(function () {

    function getInstructionsByRecipeId(recipeId) {
        var apiKey = "06238180649d43e0bffc9f3ac6536dc3";
        var queryURL = "https://api.spoonacular.com/recipes/" + recipeId + "/analyzedInstructions?apiKey=" + apiKey;

        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(function (data) {
            console.log(data);
            var arr = [], i, j;

            // Traverse steps on response and push in an array, then return array
            for (i = 0; i < data.length; ++i)
                for (j = 0; j < data[i].steps.length; ++j)
                    arr.push(data[i].steps[j].step);

            arr.forEach(element => {
                console.log(element);
            });
            
            return arr;
        });
    }

    // TEST:
    // getInstructionsByRecipeId(324694)
    //passing criteria  should return 14 steps
    getInstructionsByRecipeId(324694);

});
