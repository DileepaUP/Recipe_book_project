import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { environment } from "environments/environment";
import { catchError, map, of, switchMap, tap } from "rxjs";
import { HttpClient } from "@angular/common/http";
import * as AuthActions from './auth.actions';
import { User } from "../user.model";
import { AuthService } from "../auth.service";


export interface AuthResponseData{
    idToken: string,
    email: string, 
    refreshToken: string,
    expiresIn: string,   
    localId: string,
    registered?: boolean;
}

const handleAuthentication = (expiresIn: number, email: string, userId: string, token: string) => {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    localStorage.setItem('userData', JSON.stringify(user));
    return new AuthActions.AuthenticateSuccess({
        email: email,
        userId: userId,
        token: token,
        expirationDate: expirationDate,
        redirect: true
    });
}

const handleError = (errorRes: any) => {
    let errorMessage = "An unknown error occured!";
    
                    if(!errorRes.error || !errorRes.error.error) {
                        // console.log(errorRes.error);
                        return of(new AuthActions.AuthenticateFail(errorMessage))
                    }
                    switch(errorRes.error.error.message) {
                        case "EMAIL_EXISTS":
                            errorMessage = "This email exists already";
                            break;
                            case "INVALID_LOGIN_CREDENTIALS":
                                errorMessage = "This username/password is not correct";
                                break; 
                                
                            }
                                return of(new AuthActions.AuthenticateFail(errorMessage));
}

@Injectable()
export class AuthEffects {
    authSignup = createEffect(() => 
        this.actions$.pipe(
            ofType(AuthActions.SIGNUP_START),
            switchMap((signupAction: AuthActions.SignupStart) => {
                return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + environment.firebaseAPIKey, 
                    {
                    email: signupAction.payload.email,
                    password: signupAction.payload.password, 
                    returnSecureToken: true  
                }).pipe(
                    tap(resData => {
                        this.authService.setLogoutTimer(+resData.expiresIn * 1000);
                    }),
                    map(resData => {
                        return handleAuthentication(
                            +resData.expiresIn,
                            resData.email,
                            resData.localId,
                            resData.idToken
                        );
                    }
                    ),
                    catchError(errorRes => {
                        return handleError(errorRes);
                            })
                        );
            })
        ));

    authLogin = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.LOGIN_START),
            switchMap((authData: AuthActions.LoginStart) => {
                return this.http
                    .post<AuthResponseData>(    
                        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
                            environment.firebaseAPIKey,
                        {
                            email: authData.payload.email,
                            password: authData.payload.password,
                            returnSecureToken: true
                        }
                    )       
                    .pipe(
                        tap(resData => {
                            this.authService.setLogoutTimer(+resData.expiresIn  );
                        }),
                        map((resData) => {
                            return handleAuthentication(
                                +resData.expiresIn,
                                resData.email,
                                resData.localId,
                                resData.idToken
                            );
                        }),
                        catchError((errorRes) => {
                            return handleError(errorRes); 
                                })
                            );
                        })
                    )
                 );


    authRedirect = createEffect(
        () =>  
            this.actions$.pipe(
                ofType(AuthActions.AUTHENTICATE_SUCCESS),
                tap(
                    (authSuccessAction: AuthActions.AuthenticateSuccess) => {
                        if(authSuccessAction.payload.redirect) {
                            this.router.navigate(['/']);
                        }
                    }
                )
            ),
            { dispatch: false }
    );

    authLogout = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AuthActions.LOGOUT),
                tap(() => {
                    this.authService.clearLogoutTimer();
                    localStorage.removeItem('userData');
                    this.router.navigate(['/auth']);
                })
            ), 
            { dispatch: false }
    )

    autoLogin = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AuthActions.AUTO_LOGIN),
                map(() => {
                    const userData: {
                                email: string;
                                id: string;
                                _token: string;
                                _tokenExpirationDate: string;
                            } = JSON.parse(localStorage.getItem('userData') ?? '{}');
                            if(!userData) {
                                return {type: 'Dummy'}
                            }
                            const loadedUser = new User(userData.email, userData.id, userData._token, new Date(userData._tokenExpirationDate))
                    
                            if(loadedUser.token) {
                                const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
                                this.authService.setLogoutTimer(expirationDuration);
                                new AuthActions.AuthenticateSuccess({
                                    email: loadedUser.email,
                                    userId: loadedUser.id,
                                    token: loadedUser.token,
                                    expirationDate: new Date(userData._tokenExpirationDate),
                                    redirect: false 
                                });
                                // this.autoLogout(expirationDuration);
                            }
                            return {type: 'Dummy'}
                })
            )
    )

    constructor(
        private actions$: Actions, 
        private http: HttpClient, 
        private router: Router, 
        private authService: AuthService
    ) {}

}