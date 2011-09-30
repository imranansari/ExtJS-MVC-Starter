Ext.define('Pending.controller.SearchController', {

    extend: 'Ext.app.Controller',

    views:['SearchPanel'],

    init: function() {
        Ext.create('Ext.panel.Panel', {
            layout: 'fit',
            width: 500,

            items: {
                xtype: 'search'
            },

            renderTo: document.getElementById("search")
        });

        this.control({
            'search button[action=search]': {
                click: this.doSearch
            }
        });
    },

    doSearch: function(button) {
        var form = button.up('form');

        if (form.getForm().isValid()) {
            var values = form.getValues();
            SearchResultsController.getResults(values);
        }
    }
});