import angular from 'angular';
import 'angular-elastic';
import template from './usage-rights-editor.html!text';
import './usage-rights-editor.css!';

export var usageRightsEditor = angular.module('kahuna.edits.usageRightsEditor', [
    'monospaced.elastic'
]);

usageRightsEditor.controller('UsageRightsEditorCtrl',
                             ['$window', '$timeout', 'editsService', 'editsApi',
                              function($window, $timeout, editsService, editsApi) {

    var ctrl = this;

    // setting our initial values
    const { category: initialCatVal } = ctrl.usageRights.data;

    ctrl.saving = false;
    ctrl.saved = false;
    ctrl.categories = [];
    ctrl.model = angular.extend({}, ctrl.usageRights.data);

    // TODO: What error would we like to show here?
    // TODO: How do we make this more syncronous? You can only resolve on the
    // routeProvider, which is actually bound to the UploadCtrl in this instance
    // SEE: https://github.com/angular/angular.js/issues/2095
    editsApi.getUsageRightsCategories().then(setCategories);

    ctrl.save = () => {
        ctrl.error = null;

        if (ctrl.category) {
            save(modelToData(ctrl.model));
        } else {
            remove();
        }
    };

    ctrl.isDisabled = () => ctrl.saving;

    ctrl.isNotEmpty = () => !angular.equals(ctrl.model, {});

    ctrl.pluraliseCategory = () => ctrl.category.name +
        (ctrl.category.name.toLowerCase().endsWith('image') ? 's' : ' images');

    ctrl.restrictionsPlaceholder = () => ctrl.getCost() === 'conditional' ?
        'e.g. Use in relation to the Windsor Triathlon only' :
        'Adding restrictions will mark this image as restricted. ' +
        'Leave blank if there aren\'t any.';

    ctrl.resetModel = () => ctrl.model = {};

    ctrl.getOptionsFor = property => {
        const key = ctrl.category
                        .properties
                        .find(prop => prop.name === property.optionsMapKey)
                        .name;
        const val = ctrl.model[key];
        return property.optionsMap[val];
    };

    function setCategories(cats) {
        ctrl.categories = cats;

        // set the current category
        ctrl.category = cats.find(cat => cat.value === initialCatVal);
    }

    function modelToData(model) {
        return Object.keys(model).reduce((clean, key) => {
            // remove everything !thing including ""
            if (model[key]) {
                clean[key] = model[key];
            }

            return clean;
        }, { category: ctrl.category && ctrl.category.value });
    }

    function remove() {
        ctrl.saving = true;

        ctrl.usageRights.remove().
            then(updateSuccess).
            catch(uiError).
            finally(() => ctrl.saving = false);
    }

    function save(data) {
        ctrl.saving = true;

        ctrl.usageRights.save(data).
            then(updateSuccess).
            catch(uiError).
            finally(() => ctrl.saving = false);
    }

    function updateSuccess(resource) {
        updateResource(resource);
        ctrl.onSave();
        uiSaved();
    }

    function updateResource(resource) {
        ctrl.usageRights.resource = resource;
    }

    function uiSaved() {
        ctrl.saved = true;
        $timeout(() => ctrl.saved = false, 1500);
    }

    function uiError(error) {
        ctrl.error = error.body.errorMessage;
    }
}]);


usageRightsEditor.directive('grUsageRightsEditor', [function() {
    return {
        restrict: 'E',
        controller: 'UsageRightsEditorCtrl',
        controllerAs: 'ctrl',
        bindToController: true,
        template: template,
        scope: {
            usageRights: '=grUsageRights',
            onSave: '&?grOnSave'
        }
    };
}]);