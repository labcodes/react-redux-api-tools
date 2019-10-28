# react-redux-api-tools

[![Coverage Status](https://coveralls.io/repos/github/labcodes/react-redux-api-tools/badge.svg?branch=master)](https://coveralls.io/github/labcodes/react-redux-api-tools?branch=master) [![Build Status](https://travis-ci.org/labcodes/react-redux-api-tools.svg?branch=master)](https://travis-ci.org/labcodes/react-redux-api-tools)


This project provides a middleware and a request helper to streamline react-redux data fetching.

### Installing

Just run `npm install --save react-redux-api-tools` and you're good to go.

### Using the `fetchFromApi` helper

One of the problems of using the default fetch implementation is that it does **not** reject if the status code is 4xx.

It makes our reducers not exactly semantic, since a 400 Bad Request will be interpreted as a successful request.

For that case, we provide the `fetchFromApi` helper, which overrides fetch to reject on anything with status equal or above 400.

To use it, import it and use it on the `apiCallFunction` key, inside your actions:

##### /store/actions.js

```js
import { fetchFromApi } from "react-redux-api-tools";

// we declare a new action called createProduct that will POST to the backend
export const createProduct = (product) => {

  // first, we consolidate the request data inside a dict.
  // we follow the Request object API
  // https://developer.mozilla.org/en-US/docs/Web/API/Request

  // by default, the method is 'GET' and we use "content-type: application/json" headers,
  // but you may overwrite the headers as needed
  const requestData = {
    method: 'POST',
    body: JSON.stringify(product)
  }

  return {
    types: {
      request: 'CREATE_PRODUCTS',
      success: 'CREATE_PRODUCTS_SUCCESS',
      failure: 'CREATE_PRODUCTS_FAILURE',
    },
    // here is where we use it
    apiCallFunction: () => fetchFromApi(`/api/${product.brand}/inventory/`, requestData),
  };
}
```


### Using the middleware

#### Middleware capabilities

The middleware bundles three actions (`request`, `success` and `failure`) into one action call.

Let me show you with code. This is what a request action would look like when you're using the middleware:

```js
// we declare a new action called fetchProducts that will fetch data
export const fetchProducts = () => {
  return {
    // instead of returning the key 'type' with one action type,
    // we return three, one for each step of the request
    // inside the 'types' key
    types: {
      request: 'FETCH_PRODUCTS',
      success: 'FETCH_PRODUCTS_SUCCESS',
      failure: 'FETCH_PRODUCTS_FAILURE',
    },
    // we also declare a function that will implement the proper request
    apiCallFunction: () => fetchFromApi('/api/inventory/')
  };
}
```

That will:

- trigger the `FETCH_PRODUCTS` reducer on request start;
- trigger `FETCH_PRODUCTS_SUCCESS` if the request succeeds;
- trigger `FETCH_PRODUCTS_FAILURE` if it doesn't.


#### Making multiple requests at the same time

If you want to make multiple requests in the same call, intead of returning a single `fetchFromApi` call, you may use [`Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) passing a list of `fetchFromApi` calls:

```js
export const fetchMultipleProducts = () => {
  return {
    types: {
      request: 'FETCH_MULTIPLE_PRODUCTS',
      success: 'FETCH_MULTIPLE_PRODUCTS_SUCCESS',
      failure: 'FETCH_MULTIPLE_PRODUCTS_FAILURE',
    },
    apiCallFunction: () => Promise.all([ fetchFromApi('/api/inventory/1'), fetchFromApi('/api/inventory/2'), ])
  };
}
```

When all of them are successful, the `'FETCH_MULTIPLE_PRODUCTS_SUCCESS'` reducer will be called with a list of `Response` objects. When one of them fails, the `'FETCH_MULTIPLE_PRODUCTS_FAILURE'` will be triggered passing the `Error` instance (most probably a `TypeError: Failed to fetch` error).


#### Setup

Assuming you've already installed react and redux, to use it, you'll need to install `redux-thunk` first:

`npm install --save redux-thunk`

Then, we need to apply the middleware when the application starts:

##### App.js

```js
// on your app setup:
import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
// we import the applyMiddleware function from redux
// and the apiMiddleware from our tools
import { createStore, applyMiddleware } from 'redux';
import { apiMiddleware } from 'react-redux-api-tools';

import Routes from './routes';
import rootReducer from './store/reducers';

// then, when we create the base store, we apply the middleware
const store = createStore(rootReducer, applyMiddleware(thunk, apiMiddleware));


class App extends React.Component {
  render () {
    return (
      <Provider store={store}>
        <Routes />
      </Provider>
    )
  }
}
```

Then, every time you want to create an action that calls an api, you just need to pass the three types and an api call function as we have stated above:

##### /store/actions.js

```js
// we declare a new action called fetchProducts that will fetch data
export const fetchProducts = (brand) => {
  return {
    // instead of returning the key 'type' with one action type,
    // we return three, one for each step of the request
    // inside the 'types' key
    types: {
      request: 'FETCH_PRODUCTS',
      success: 'FETCH_PRODUCTS_SUCCESS',
      failure: 'FETCH_PRODUCTS_FAILURE',
    },
    // we also declare a function that will implement the proper request
    apiCallFunction: () => fetchFromApi(`/api/${brand}/inventory/`),

    // there is an optional callback so we can stop a request if we don't need to refetch the data
    // it works both for request and default actions
    shouldDispatch: (appState, action) => { return !appState.products.items.length },

    // and you may as well pass some extra data, if needed
    extraData: {
      brand,
      anything: 'could go here, and it will be available on the action.extraData attribute'
    }
  };
}
```

On the reducers side, nothing much changes. We pass the `response` (always) and `error` (when the request fails) objects to the action, so we can get the response/error data on the reducers:

##### /store/reducers.js

```js
const productReducer = (state = { isLoading: false }, action) => {
  switch(action.type) {

    case 'FETCH_PRODUCTS':
      return {
        ...state,
        isLoading: true,
        error: null,
        // the extraData will be available in all related reducers
        // so, if you need it...
        brand: action.extraData.brand
      };

    case 'FETCH_PRODUCTS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        // the action has the response built in
        // and the middleware detects if the response is a json response
        // so it can populate the response.data without needing to resolve promises
        items: action.response.data
      };

    case 'FETCH_PRODUCTS_FAILURE':
      return {
        ...state,
        isLoading: false,
        // same thing for errors, but on the error key,
        // so you can check if it exists on the component side
        error: action.error.data,
        // though the response key will always be populated
        response: action.response,
        items: []
      };

    default:
      return state;
  }
}
```

Finally, on the component, you'll just need to bind it with redux and the code will be **so** clean:

##### /components/ProductsList.js

```jsx
import React from 'react';
import { connect } from 'react-redux'
import { fetchProducts } from '../store/actions';


class ProductsList extends React.Component {

  componentDidMount(){
    // we just need to dispatch it. ONCE. no redux management here.
    this.props.fetchProducts();
  }

  render(){
    const { isLoading, error, items } = this.props;

    if (isLoading) {
      return <h1>Loading...</h1>
    }

    if (error) {
      return <p className='error'>{JSON.stringify(error.data)}</p>
    }

    return (
      <React.Fragment>
        <h1>Products List</h1>
        {items.map(product => (
          <p>{product.name}</p>
          )
        )}
      </React.Fragment>
    );
  }
}

// here, we bind the redux state as component props:
const mapStateToProps = (state) => ({
  isLoading: state.isLoading,
  items: state.items,
  error: state.error,
});
// and bind the action dispatch to a prop as well:
const mapDispatchToProps = (dispatch) => ({
  fetchProducts: () => dispatch(fetchProducts())
});

// and connect it to redux :)
export default connect(mapStateToProps, mapDispatchToProps)(ProductsList);
```

### Contributing

Don't hesitate to open an issue for bugs!

But if you would like a new feature, it would be nice to discuss it before accepting PRs. We reserve ourselves the right to reject a feature that was not discussed or that will impact the code in a meaningful way. In that case, open an issue so we can discuss. Thanks. <3
