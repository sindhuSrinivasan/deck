import * as _ from 'lodash';

class FastPropertyFilterDirective implements ng.IDirective {

  scope: any = {
    'properties': '=',
    'filters': '=',
    'createFilterTag': '='
  };
  template: string = `<input type="search" class="form-control" placeholder="Filters: type '?'">`;
  restrict: string = 'E';
  fields: string[] = ['app', 'env', 'region', 'stack', 'cluster'];

  link(scope: any, el: any) {
    let input = el.children('input');

    let getScopeAttributeList = (scopeName: string) => {
      let results = ['none'].concat(<string[]> _.uniq(scope.properties.map((prop: any) => prop.scope[scopeName])));
      return results;
    };

    let textcompleteComponents = this.fields.map((field) => {
      return {
        id: field,
        match: new RegExp(`${field}:(\\w*|\\s*)$`),
        index: 1,
        search: (term: string, callback: any) => {
          callback(getScopeAttributeList(field).filter((attr: string) => {
            if (attr.includes(term) ) {
              return attr;
            }
          }));
        },
        replace: (attr: string): string => {
          let copy = scope.filters.list.splice(0);
          let tagBody = {label: field, value: attr};
          copy.push(scope.createFilterTag(tagBody));
          scope.filters.list = _.uniqWith(copy, (a: any, b: any) => a.label === b.label && a.value === b.value);
          scope.$apply();
          return '';
        }
      };
    });

    input.textcomplete(_.flatten([
      textcompleteComponents,
      {
        match: /(\s*|\w*)\?(\s*|\w*|')$/,
        index: 2,
        search: (term: string, callback: any) => {
          callback($.map(this.fields, (word: string) => {
            return word.indexOf(term) > -1 ? word : null;
          }));
        },
        replace: (word: string) => {
          return `${word}:`;
        }
      },
      {
        match: /(^|\b)(\w{1,})$/,
        search: (term: string, callback: any): any => {
          callback($.map(this.fields, (word: string) => {
            return word.indexOf(term) > -1 ? word : null;
          }));
        },
        replace: (word: string): string => {
          return `${word}:`;
        }
      },

    ]));
  }
}

class DirectiveFactory {

  public static getFactoryFor<T extends ng.IDirective>(classType: Function): ng.IDirectiveFactory {
    let factory = (...args: any[]): T => {
      let directive = <any>classType;
      return new directive(args);
    };

    factory.$inject = classType.$inject;
    return factory;
  }
}

const moduleName = 'spinnaker.netflix.fastPropertyFilter.directive';

angular
  .module(moduleName, [])
  .directive('fastPropertyFilter', DirectiveFactory.getFactoryFor(FastPropertyFilterDirective));

export default moduleName;
