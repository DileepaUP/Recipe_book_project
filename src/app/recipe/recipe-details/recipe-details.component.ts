import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { Recipe } from '../recipe.model';
import * as fromApp from '../../store/app.reducer';
import { map, switchMap } from 'rxjs';
import * as RecipesActions from '../store/recipe.actions';
import * as ShoppingListActions from '../../shopping-list/store/shopping-list.actions';


@Component({
    selector: 'app-recipe-details',
    templateUrl: './recipe-details.component.html',
    styleUrl: './recipe-details.component.css',
    standalone: false
})
export class RecipeDetailsComponent implements OnInit{
  recipe: Recipe;
  id: number;

  constructor(private route: ActivatedRoute, private router: Router, private store: Store<fromApp.AppState>) {}

  ngOnInit() {
    this.route.params.pipe(map(params => {
      return +params['id'];
    }), switchMap(id => {
      this.id = id;
      return this.store.select('recipes');
    }), map(recipesState => {
      return recipesState.recipes.find((recipe, index) => {
        return index === this.id;
      });
    })).subscribe(recipe => {
      this.recipe = recipe;
    })
    
    // subscribe(
    //   (parameter: Params) => {
    //     this.id = +parameter['id'];
    //     this.store.select('recipes').pipe(map(recipeState => {
    //       return recipeState.recipes.find((recipe, index) => {
    //         return index === this.id;
    //       })
    //     })).
    //     })
      }
    
   

  onAddToShoppingList() {
    // this.recipeService.addIngredientsToShoppingList(this.recipe.ingredients);
    this.store.dispatch(new ShoppingListActions.AddIngredients(this.recipe.ingredients));
  }

  onEditRecipe() {
    this.router.navigate(['edit'], {relativeTo: this.route});
  }

  onDeleteRecipe() {
    // this.recipeService.deleteRecipe(this.id);
    this.store.dispatch(new RecipesActions.DeleteRecipe(this.id));
    this.router.navigate(['/recipes']);
  }

}
