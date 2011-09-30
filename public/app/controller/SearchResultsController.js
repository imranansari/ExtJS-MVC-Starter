Ext.define('Pending.controller.SearchResultsController', {

	extend: 'Ext.app.Controller',

	models: ['Policy'],
	stores: ['Policies'],
	views: ['SearchResultsGrid'],

	init: function() {
		Ext.create('Ext.panel.Panel', {
			layout: 'fit',
			height: 300,
			width: 500,

			items: {
				xtype: 'searchResults'
			},

			renderTo: document.getElementById("results")
		});

		Ext.create('Pending.view.SearchResultsGrid').show();
	}
});