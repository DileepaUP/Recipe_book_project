import { Component, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Subscription } from 'rxjs';

import { Recipe } from '../recipe.model';
import * as fromApp from '../../store/app.reducer';
import { Store } from '@ngrx/store';

@Component({
    selector: 'app-recipe-list',
    templateUrl: './recipe-list.component.html',
    styleUrl: './recipe-list.component.css',
    standalone: false
})
export class RecipeListComponent implements OnInit, OnDestroy {
  subscription: Subscription;

  recipes: Recipe[];
  
  constructor(private router: Router, private route: ActivatedRoute, private store: Store<fromApp.AppState>) {}

  ngOnInit() {
    this.subscription = this.store.select('recipes').pipe(map(recipesState => recipesState.recipes)).subscribe(
      (recipes: Recipe[]) => {
        this.recipes = recipes;
      }
    );
  }

  onNewRecipe() {
    this.router.navigate(['new'], {relativeTo: this.route});
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
}
