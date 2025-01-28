import { Component, OnDestroy, OnInit } from "@angular/core"
import { map, Subscription } from "rxjs";
import { Store } from "@ngrx/store";
import * as AuthActions from '../auth/store/auth.actions';
import * as RecipeActions from '../recipe/store/recipe.actions';   

import * as fromApp from '../store/app.reducer';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
    standalone: false
})
export class HeaderComponent implements OnInit, OnDestroy{
    isAuthenticated = false;
    private userSub: Subscription;

    constructor(private store: Store<fromApp.AppState>) { }

    ngOnInit(): void {
        this.userSub = this.store.select('auth').pipe(map(authState => authState.user)).subscribe(user => {
            this.isAuthenticated = !!user;
        });
    }

    onSaveData() {
        // this.dataStorageService.storeRecipes();
        this.store.dispatch(new RecipeActions.StoreRecipes());
    }

    onFetchData() {
        // this.dataStorageService.fetchRecipes().subscribe();
        this.store.dispatch(new RecipeActions.FetchRecipes());
    }

    ngOnDestroy(): void {
        this.userSub.unsubscribe();
    }

    onLogout() {
        this.store.dispatch(new AuthActions.Logout());
    }

}