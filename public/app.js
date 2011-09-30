Ext.Loader.setConfig({
    enabled: true
});

Ext.create('Ext.app.Application', {

    name: 'Pending',
    autoCreateViewport: false,
    controllers: ['SearchController', 'SearchResultsController'],

    launch: function() {
    }
});