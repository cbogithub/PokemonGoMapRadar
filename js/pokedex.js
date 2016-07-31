window.ko.bindingHandlers.popover = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        $(element).popover();
    }
}

var pogo = new (function(){
	var self = this;
	
	this.evolutionResult = ko.observable();
    this.eeveelutionResult = ko.observableArray();
	this.selectedPokemon = ko.observable();
	this.combatPower = ko.observable();
    this.currentOrder = ko.observable("Name");
    
    this.toggleOrder = function(){
        self.currentOrder(self.currentOrder() == "Name" ? "Number" : "Name");
    }
    this.sortedPokemons = ko.computed(function(){
        return _.sortBy(_pokemons,self.currentOrder());
    });
    this.evolutionPokemons = ko.computed(function(){
        return _.filter(self.sortedPokemons(), function(pokemon){
			return "Next evolution(s)" in pokemon && pokemon.Name in _multipliers;
		});
    });
	this.calculateResult = function(){
		var evolvedCombatPower = "";

        id= $('select').find("option:selected").text();
        id = id.split(' - ');
        if(typeof id[1] === 'undefined'){
            return;
        }
        var combatPower = parseInt($('input#cp').val());
        var curpokemon = _pokemons[parseInt(id[1])];
        if ( combatPower > 0 ){
            var originalPokemon = curpokemon.Name, finalEvolvedPokemon = "", finalEvolvedPokemonCombatPower = "", evolvedPokemonMultiplier = "", originalPokemonMultiplier = "";
            if ( originalPokemon == "Eevee"){
                var evolvedPokemonArr = [{ name: "Jolteon", nickname: "Sparky" },{ name: "Flareon", nickname: "Pyro"},{ name: "Vaporeon", nickname: "Rainer"}];
                var eeveelutions = _.map(evolvedPokemonArr, function(eevolution){
                    var multipliers =  _multipliers[eevolution.name];
                    var minMultiplier = multipliers[0];
                    var maxMultiplier = multipliers[1];
                    var tmp = {
                        name: eevolution.name,
                        nickname: eevolution.nickname,
                        minCP: parseInt(combatPower * minMultiplier),
                        maxCP: parseInt(combatPower * maxMultiplier),
                        minRate: minMultiplier,
                        maxRate: maxMultiplier
                    };
                    return tmp;
                });
                self.evolutionResult(null);
                self.eeveelutionResult(eeveelutions);
            } else {
                self.eeveelutionResult([]);
                var arrEvolutions = [], requirements;
                var firstGenMultipliers = _multipliers[curpokemon.Name];
                if ( _.isArray(firstGenMultipliers) ){
                    evolvedCombatPower = parseInt(combatPower * firstGenMultipliers[0]) + "-" + parseInt(combatPower * firstGenMultipliers[1]);
                    originalPokemonMultiplier = firstGenMultipliers.join("-");
                } else {
                    evolvedCombatPower = "" + parseInt(combatPower * firstGenMultipliers);
                    originalPokemonMultiplier = firstGenMultipliers;
                }
                requirements = curpokemon["evoRequirements"];
                if(typeof requirements === 'undefined'){
                    requirements = {Amount: 0, Name: ''};
                }
                arrEvolutions.push({
                    name: curpokemon.Name,
                    cp: combatPower,
                    mcp: parseInt(_maxCP[curpokemon.Name]),
                    multiplier: originalPokemonMultiplier,
                    requirements: requirements.Amount
                });
                var evolutions = curpokemon["Next evolution(s)"];
                /* Pokemon always has a 2nd evolution */
                var secondEvolution = {}, thirdEvolution = {};
                if(typeof evolutions !== 'undefined'){
                    var evolvedPokemon = evolutions[0].Name;
                    var requirements = false;
                    $.each(_pokemons, function(e, val){
                        if(val.Name == evolvedPokemon){
                            if(typeof val["evoRequirements"] === 'undefined'){
                                requirements = {Amount: 0, Name: ''};
                            }
                            else{
                                requirements = val["evoRequirements"];   
                            }
                            return;
                        }
                    });
                    var secondEvolution = {
                        name: evolvedPokemon,
                        cp: evolvedCombatPower,
                        mcp: parseInt(_maxCP[evolvedPokemon]),
                        multiplier: "&nbsp;",
                        requirements: requirements.Amount
                    }
                }
                /* Pokemon has a 3rd evolution */
                if(typeof evolutions !== 'undefined'){
                    if ( evolutions.length > 1 ){
                        //console.log("evolvedPokemon in _multipliers", evolvedPokemon in _multipliers, evolvedPokemon);
                        if ( evolvedPokemon in _multipliers ){
                            finalEvolvedPokemon = evolutions[1].Name;
                            //console.log("finalEvolvedPokemon", finalEvolvedPokemon);
                            var secondGenMultipliers = _multipliers[evolvedPokemon];                    
                            if ( _.isArray(secondGenMultipliers) || evolvedCombatPower.indexOf("-") > -1 ){
                                var minCombatPower = 0,
                                    maxCombatPower = 0,
                                    minMultiplier = 0,
                                    maxMultiplier = 0; 
                                if (_.isArray(secondGenMultipliers)){                       
                                    minMultiplier = secondGenMultipliers[0];
                                    maxMultiplier = secondGenMultipliers[1];
                                    evolvedPokemonMultiplier = secondGenMultipliers.join("-");
                                } else {
                                    minMultiplier = secondGenMultipliers;
                                    maxMultiplier = secondGenMultipliers;
                                    evolvedPokemonMultiplier = secondGenMultipliers;
                                }
                                secondEvolution.multiplier = evolvedPokemonMultiplier;
                                if (evolvedCombatPower.indexOf("-") > -1){                      
                                    var evolvedCombatPowerRange = evolvedCombatPower.split("-");
                                    minCombatPower = parseInt(evolvedCombatPowerRange[0]);
                                    maxCombatPower = parseInt(evolvedCombatPowerRange[1]);
                                } else{
                                    minCombatPower = parseInt(evolvedCombatPower);
                                    maxCombatPower = parseInt(evolvedCombatPower);
                                }                       
                                finalEvolvedPokemonCombatPower = parseInt(minCombatPower * minMultiplier) + "-" + parseInt(maxCombatPower * maxMultiplier);             
                            } else {
                                finalEvolvedPokemonCombatPower = parseInt(evolvedCombatPower * secondGenMultipliers);
                            }
                            thirdEvolution = {
                                name: finalEvolvedPokemon,
                                cp: finalEvolvedPokemonCombatPower,
                                mcp: parseInt(_maxCP[finalEvolvedPokemon]),
                                requirements: "&nbsp;",
                                multiplier: "&nbsp;"
                            };
                        }
                    }
                }
                arrEvolutions.push(secondEvolution);
                if ( !_.isEmpty(thirdEvolution) ){
                    arrEvolutions.push(thirdEvolution);
                }
                self.evolutionResult(arrEvolutions);
            }
        } else {
            alert("Invalid Combat Power Entered");
        }
	}
	$(window).resize(function(){
        //$('#screen').height($('#screen').get(0).offsetWidth)
    })
	this.init = function(){	
		ko.applyBindings(self);
        $(window).resize();
        $('#screen-controls input').val('1');
        self.currentOrder(self.currentOrder() == "Name" ? "Number" : "Name");
	}
});
function calculate(){
    id= $('select').find("option:selected").text();
    $('#screen #img *').hide();
    if(id !== 'Select a Pokemon'){
        id = id.split(' - ')[1];
        $('#screen').addClass('on').find('#img img').attr('src', 'sprites/'+parseInt(id)+'.png');
        $('#screen #img *').show();
        pogo.calculateResult();
    }
    else{
        $('#screen').removeClass('on').find('#img img').removeAttr('src');
    }
}
$(document).on('click', '#screen', function(){
    $('select option:selected').removeAttr('selected').next().attr('selected', 'selected');
    $('select').change();
})
$(document).on('change', 'select, #cp', calculate);
$(document).on('mousedown', '#cp-controls span', function(){
    input = $('input#cp');
    cp = parseInt(input.val());
    elm = $(this);
    if(elm.hasClass('add')){
        cp++;
    }
    else{
        if(cp > 1){
            cp--;   
        }
    }
    input.val(cp).change();
    calculate();
});
$(document).ready(pogo.init);