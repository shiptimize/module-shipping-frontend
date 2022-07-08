# module-shipping-frontend
The frontend source for the magento2 plugin module-shipping

The scripts in our modules are transpiled from ES6 to ES5 using node. Should you wish to inspect or adjust the scripts your can do so using this source as long as you are ready to also own your changes with any bugs that may come from it.  

1) Adjust webpack.config.js to match your folder structure. This code assumes that the frontend source is one level above app.
2) Install the necessary node modules by running 

  ```npm install```
  
3) Run a dev version 

  ```npm run dev ```
  
4) When you are finished making changes 

```npm run prod ```
