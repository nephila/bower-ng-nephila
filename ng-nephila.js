/*!
 * ngNephila
 * v0.0.2
 * Copyright 2015 Nephila http://nephila.it/
 * See LICENSE in this repository for license information
 */
(function(){
angular.module('ngNephila', [
  'ngNephila.filters',
  'ngNephila.services',
  'ngNephila.components'
]);
angular.module('ngNephila.filters', [
  'ngNephila.filters.range',
  'ngNephila.filters.titlecase',
  'ngNephila.filters.stripHtml'
]);

angular.module('ngNephila.filters.range', [])
.filter('range', function(){
  return function(start, end, step) {
    var res = [];
    var leftToRight = true;
    if (step < 1) {
      throw new Error('Step parameter must be >= 1');
    }
    step = ( step === undefined || step === null ) ? 1 : step;
    if (end === undefined || end === null) {
      end = start;
      start = 0;
    }
    if (start > end) {
      var aux = end;
      end = start;
      start = aux;
      leftToRight = false;
    }
    for (var i = start; i < end; i+=step) {
      if (leftToRight) {
        res.push(i);
      } else {
        res.unshift(i);
      }
    }
    return res;
  };
});
angular.module('ngNephila.filters.stripHtml', [])
.filter('stripHtml', function() {
  return function(s) {
    return s ? String(s).replace(/<[^>]+>/gm, '') : '';
  };
});
angular.module('ngNephila.filters.titlecase', [])
.filter('titlecase', function() {
  return function(s, onlyFirst) {
    s = ( s === undefined || s === null ) ? '' : s;
    onlyFirst = ( onlyFirst === undefined || onlyFirst === null ) ? false : onlyFirst;
    var regexp = /\b([a-z])/g;
    if (onlyFirst) {
      regexp = /\b([a-z])/;
    }
    return s.toString().toLowerCase().replace( regexp, function(ch) {
      return ch.toUpperCase();
    });
  };
});
angular.module('ngNephila.services.debounce', [])
.factory('debounce', ['$timeout','$q', function($timeout, $q) {
  return function debounce(func, wait, immediate) {
    var timeout;
    var deferred = $q.defer();
    return function() {
      var context = this;
      var args = arguments;
      var later = function() {
        timeout = null;
        if(!immediate) {
          deferred.resolve(func.apply(context, args));
          deferred = $q.defer();
        }
      };
      var callNow = immediate && !timeout;
      if ( timeout ) {
        $timeout.cancel(timeout);
      }
      timeout = $timeout(later, wait);
      if (callNow) {
        deferred.resolve(func.apply(context, args));
        deferred = $q.defer();
      }
      return deferred.promise;
    };
  };
}]);
angular.module('ngNephila.services', [
  'ngNephila.services.pagination',
  'ngNephila.services.debounce',
  'ngNephila.services.scrolledInContainer',
  'ngNephila.services.tts'
]);
angular.module('ngNephila.services.pagination', [])
.provider('pagination', function paginationProvider() {

  var itemsPerPage = 0;

  this.setItemsPerPage = function (extItemsPerPage) {
    itemsPerPage = extItemsPerPage;
  };

  function PaginatorFactory() {
    this.getPaginator = function () {
      return new Paginator();
    };
  }

  function Paginator() {

    var numberOfItems;
    var pageChange = function(page) {};
    var currentPage = 1;

    this.onPageChange = function (pageChangeFunc) {
      pageChange = pageChangeFunc;
    };

    this.getCurrentPage = function () {
      return currentPage;
    };

    this.goToPage = function (page) {
      if (page < 1 || page > this.getNumberOfPages()) {
        throw new Error('Wrong page to go to');
      }
      currentPage = page;
      pageChange(page);
    };

    this.next = function () {
      if (currentPage + 1 <= this.getNumberOfPages()) {
        currentPage++;
      }
      pageChange(currentPage);
    };

    this.prev = function () {
      if (currentPage - 1 > 0) {
        currentPage--;
      }
      pageChange(currentPage);
    };

    this.setNumberOfItems = function (extNumberOfItems) {
      numberOfItems = extNumberOfItems;
      return numberOfItems;
    };

    this.getNumberOfPages = function () {
      return Math.ceil(numberOfItems / itemsPerPage);
    };

  }

  this.$get = function() {
    return new PaginatorFactory();
  };
});

angular.module('ngNephila.services.scrolledInContainer', [])
.factory('scrolledInContainer', function() {
  return function(element, container) {
    var elementBox = element.getBoundingClientRect();
    var visible = (!element.style.opacity || element.style.opacity > 0) &&
      element.style.display !== 'none' &&
      element.style.visibility !== 'hidden';

    if (!visible) {
      return false;
    }

    if (!container.getBoundingClientRect) {
      return (elementBox.top >= 0 && elementBox.bottom <= container.innerHeight);
    }

    var containerBox = container.getBoundingClientRect();

    return (elementBox.bottom <= containerBox.bottom);
  };
});

angular.module('ngNephila.services.tts', [])
.factory('tts', ['$q', function($q) {
  var ready = false;
  var readyCallback;
  var q;
  var inProgress = false;
  responsiveVoice.OnVoiceReady = function() {
    if (ready === false) {
      if (readyCallback !== undefined) {
        readyCallback.call();
      }
      ready = true;
    }
  };
  return {
    isReady: function() {
      return ready;
    },
    onVoiceReady: function(callback) {
      readyCallback = callback;
    },
    stop: function() {
      if (!inProgress) {
        return;
      }
      if (q) {
        q.resolve();
      }
      responsiveVoice.cancel();
      inProgress = false;
    },
    speak: function(text, voice, options) {
      if (inProgress) {
        this.stop();
      }
      q = $q.defer();
      if (voice === undefined) {
        voice = 'UK English Male';
      }
      if (options === undefined) {
        options = {};
      }
      options.onstart = function() {
        inProgress = true;
      };
      options.onend = function() {
        if (!inProgress) {
          return;
        }
        if (q) {
          q.resolve();
        }
      };
      try {
        responsiveVoice.speak(text, voice, options);
      } catch (err) {
        q.reject(err);
      }
      return q.promise;
    }
  };
}]);
angular.module('ngNephila.components.datePicker', [
  'ngNephila.tpls.datepicker.datepicker'
])
.directive('datePicker', ['$document', function($document) {
  return {
    restrict: 'E',
    scope: {
      ngModel: '='
    },
    link: function (scope, element, attrs) {

      scope.viewFormat = attrs.viewFormat || 'DD MMMM YYYY';
      scope.locale = attrs.locale || 'en';
      scope.firstWeekDaySunday = scope.$eval(attrs.firstWeekDaySunday) || false;
      scope.placeholder = attrs.placeholder || '';

      scope.calendarOpened = false;
      scope.days = [];
      scope.dayNames = [];
      scope.viewValue = null;
      scope.dateValue = null;

      moment.locale(scope.locale);
      var date = moment(scope.ngModel);
      scope.viewValue = date.format(scope.viewFormat);

      var generateCalendar = function (date) {
        var lastDayOfMonth = date.endOf('month').date(),
          month = date.month(),
          year = date.year(),
          n = 1;

        var firstWeekDay = scope.firstWeekDaySunday === true ? date.set('date', 2).day() : date.set('date', 1).day();
        if (firstWeekDay !== 1) {
          n -= firstWeekDay - 1;
        }

        scope.dateValue = date.format('MMMM YYYY');
        scope.days = [];

        for (var i = n; i <= lastDayOfMonth; i += 1) {
          if (i > 0) {
            scope.days.push({day: i, month: month + 1, year: year, enabled: true});
          } else {
            scope.days.push({day: null, month: null, year: null, enabled: false});
          }
        }
      };

      var generateDayNames = function () {
        var date = scope.firstWeekDaySunday === true ?  moment('2015-06-07') : moment('2015-06-01');
        for (var i = 0; i < 7; i += 1) {
          scope.dayNames.push(date.format('ddd'));
          date.add('1', 'd');
        }
      };

      generateDayNames();

      scope.showCalendar = function () {
        scope.calendarOpened = true;
        generateCalendar(date);
      };

      scope.closeCalendar = function () {
        scope.calendarOpened = false;
      };

      scope.prevYear = function () {
        date.subtract(1, 'Y');
        generateCalendar(date);
      };

      scope.prevMonth = function () {
        date.subtract(1, 'M');
        generateCalendar(date);
      };

      scope.nextMonth = function () {
        date.add(1, 'M');
        generateCalendar(date);
      };

      scope.nextYear = function () {
        date.add(1, 'Y');
        generateCalendar(date);
      };

      scope.selectDate = function (event, date) {
        event.preventDefault();
        var selectedDate = moment(date.day + '.' + date.month + '.' + date.year, 'DD.MM.YYYY');
        scope.ngModel = selectedDate.toDate();
        scope.viewValue = selectedDate.format(scope.viewFormat);
        scope.closeCalendar();
      };

      var classList = ['datepicker', 'datepicker-input'];
      if (attrs.id !== undefined) {
        classList.push(attrs.id);
      }
      $document.on('click', function (e) {
        if (!scope.calendarOpened) {
          return;
        }
        var i = 0,
          element;

        if (!e.target) {
          return;
        }

        for (element = e.target; element; element = element.parentNode) {
          var id = element.id;
          var classNames = element.className;

          if (id !== undefined) {
            for (i = 0; i < classList.length; i += 1) {
              if (id.indexOf(classList[i]) > -1 || classNames.indexOf(classList[i]) > -1) {
                return;
              }
            }
          }
        }

        scope.closeCalendar();
        scope.$apply();
      });

    },
    templateUrl: function(elem,attrs) {
      return attrs.templateUrl || 'template/datepicker/datepicker.html';
    }
  };

}]);

angular.module('ngNephila.components.fallbackImg',[])
.directive('fallbackImg', function () {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function () {
        angular.element(this).attr('src', attrs.fallbackImg);
      });
    }
  };
});

angular.module('ngNephila.components.focusMe',[])
.directive('focusMe', ['$timeout', function($timeout) {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.focusMe, function(value) {
        if(value === true) {
          $timeout(function() {
            element[0].focus();
          });
        }
      });
    }
  };
}]);

angular.module('ngNephila.components.infinitescroll', [
  'ngNephila.services.scrolledInContainer'
])
.directive('infiniteScroll', [
  '$window', '$rootScope', 'scrolledInContainer', function($window, $rootScope, scrolledInContainer) {
    return {
      restrict: 'E',
      scope: {
        scrollContainer: '=',
        onInfinite: '&',
        ngIf: '&',
      },
      link: function(scope, elem, attrs) {
        var visible = false;
        var windowElement = angular.element($window);
        var container = null;
        var reached;
        var handler = function() {
          if (scope.ngIf() === false) {
            return;
          }
          reached = scrolledInContainer(elem[0], container[0]);
          if (reached && !visible) {
            visible = true;
            if (scope.$$phase || $rootScope.$$phase) {
              scope.onInfinite();
            } else {
              scope.$apply(scope.onInfinite);
            }
          } else if (!reached && visible) {
            visible = false;
          }
        };
        var changeContainer = function(newContainer) {
          if (container != null) {
            container.unbind('scroll', handler);
          }
          container = newContainer;
          if (newContainer != null) {
            return container.bind('scroll', handler);
          }
        };
        if (scope.scrollContainer) {
          changeContainer(angular.element(scope.scrollContainer));
        } else {
          changeContainer(windowElement);
        }
        handler();
      }
    };
  }
]);
angular.module('ngNephila.components.modal', [
  'ngNephila.tpls.modal.modal'
])
.directive('modal', function() {
  return {
    restrict: 'E',
    scope: {
      show: '='
    },
    transclude: true,
    link: function(scope, element, attrs, transcludeFn) {
      scope.dialogStyle = {};
      scope.hideModal = function() {
        scope.show = false;
      };
    },
    templateUrl: function(elem,attrs) {
      return attrs.templateUrl || 'template/modal/modal.html';
    }
  };
});
angular.module('ngNephila.components', [
  'ngNephila.components.infinitescroll',
  'ngNephila.components.fallbackImg',
  'ngNephila.components.paginator',
  'ngNephila.components.toggle',
  'ngNephila.components.datePicker',
  'ngNephila.components.modal',
  'ngNephila.components.tabsaccordion',
  'ngNephila.components.focusMe'
]);
angular.module('ngNephila.components.paginator', [
  'ngNephila.services.pagination',
  'ngNephila.filters.range',
  'ngNephila.tpls.paginator.paginator'
])
.directive('paginator', [
  '$filter', 'pagination', function($filter, pagination) {
    return {
      restrict: 'E',
      scope: {
        onPageChange: '&',
        numberOfItems: '=',
        start: '=',
        compress: '@',
        prevLabel: '@',
        nextLabel: '@',
        compressLabel: '@'
      },
      templateUrl: function(elem,attrs) {
        return attrs.templateUrl || 'template/paginator/paginator.html';
      },
      controller: ['$scope', function ( $scope ) {
        $scope.pagesVisibility = [];
        $scope.paginator = pagination.getPaginator();
        $scope.paginator.setNumberOfItems(parseInt($scope.numberOfItems));
        $scope.pages = $filter('range')(1, 1 + $scope.paginator.getNumberOfPages());
        $scope.calculatePagesVisiblity = function() {
          var compress = parseInt($scope.compress);
          if (!compress) {
            return;
          }
          var currentPage = $scope.paginator.getCurrentPage();
          var numberOfPages = $scope.paginator.getNumberOfPages();
          if (!numberOfPages) {
            return;
          }
          $scope.pagesVisibility = new Array(numberOfPages+1);
          var left = currentPage - compress;
          var right = currentPage + compress;
          var firstLeftReached = false;
          var firstRightReached = false;
          if (left < 0) {
            right = right + (left * -1);
            left = 1;
          }

          for (var page = 1 ; page <= numberOfPages ; page++) {
            // Create visibility infos for page
            $scope.pagesVisibility.splice(page, 0, {
              visibility: false,
              firstHide: false
            });
            // Set visibilities for boundaries or other elements
            if (page < 3 || page > numberOfPages - 2) {
              $scope.pagesVisibility[page].visibility = true;
            } else {
              if (page < left) {
                $scope.pagesVisibility[page].visibility = false;
              } else if (page > right) {
                $scope.pagesVisibility[page].visibility = false;
              } else {
                $scope.pagesVisibility[page].visibility = true;
              }
              // Get first hide on the left side
              if ($scope.pagesVisibility[page].visibility === false) {
                if (!firstLeftReached) {
                  $scope.pagesVisibility[page].firstHide = true;
                  firstLeftReached = true;
                }
              }
              // Get first hide on the right side
              if (page == right + 1) {
                if (firstLeftReached && !firstRightReached) {
                  $scope.pagesVisibility[page].firstHide = true;
                  firstRightReached = true;
                }
              }
            }
          }
          // Do not hide a single element between 2 visible elements
          if (left - 2 >= 1 && $scope.pagesVisibility[left - 2].visibility === true) {
            $scope.pagesVisibility[left - 1].visibility = true;
            $scope.pagesVisibility[left - 1].firstHide = false;
          }
          if (right + 2 < numberOfPages && $scope.pagesVisibility[right + 2].visibility === true ) {
            $scope.pagesVisibility[right + 1].visibility = true;
            $scope.pagesVisibility[right + 1].firstHide = false;
          }
        };
        $scope.canHide = function(page) {
          if (!$scope.pagesVisibility.length) {
            return false;
          }
          return !$scope.pagesVisibility[page].visibility && !$scope.pagesVisibility[page].firstHide;
        };
        $scope.isFirstCanHide = function(page) {
          if (!$scope.pagesVisibility.length) {
            return false;
          }
          return $scope.pagesVisibility[page].firstHide;
        };
        $scope.paginator.onPageChange(function (page) {
          $scope.onPageChange({page: page});
          $scope.calculatePagesVisiblity();
        });
        $scope.paginator.goToPage(parseInt($scope.start));
      }],
      link: function(scope, elem, attrs) {
        scope.$watch('numberOfItems', function(newValue, oldValue) {
          scope.paginator.setNumberOfItems(parseInt(newValue));
          scope.pages = $filter('range')(1, 1 + scope.paginator.getNumberOfPages());
          scope.calculatePagesVisiblity();
        });
      }
    };
  }
]);

angular.module('ngNephila.components.tabsaccordion', [])
.directive('tabsaccordion', function() {
  return {
    restrict: 'E',
    scope: {},
    transclude: true,
    replace: true,
    controller: function($scope) {
      var vm = this;
      vm.$scope = $scope;
      $scope.statuses = {};
      $scope.contents = {};

      $scope.setStatus = function(key, status) {
        if (status === true) {
          for (var k in $scope.statuses) {
            $scope.statuses[k] = false;
          }
        }
        $scope.statuses[key] = status;
      };

      $scope.getStatus = function(key) {
        return $scope.statuses[key];
      };

      $scope.setContent = function(key, content) {
        $scope.contents[key] = content;
      };

      $scope.getContent = function(key) {
        return $scope.contents[key];
      };

    },
    link: function(scope, element, attrs, transcludeFn) {

    },
    template: '<div ng-transclude></div>',
  };
})
.directive('tabheaders', function() {
  return {
    restrict: 'E',
    scope: {},
    transclude: true,
    replace: true,
    controller: function($scope) {

    },
    link: function(scope, element, attrs, transcludeFn) {

    },
    template: '<ul class="tab-headers" ng-transclude></ul>',
  };
})
.directive('tabcontents', function() {
  return {
    restrict: 'E',
    scope: {},
    transclude: true,
    replace: true,
    controller: function($scope) {
    },
    link: function(scope, element, attrs, transcludeFn) {

    },
    template: '<div class="tab-contents" ng-transclude></div>',
  };
})
.directive('tabheader', function() {
  return {
    scope: {
      ref: '@',
      selected: '='
    },
    require: '^tabsaccordion',
    restrict: 'E',
    transclude: true,
    replace: true,
    link: function(scope, element, attrs, tabsaccordion) {
      scope.selected = (scope.selected || false);
      tabsaccordion.$scope.setStatus(attrs['ref'], scope.selected);
      tabsaccordion.$scope.setContent(
        attrs['ref'],
        element.find('a')[0].innerHTML
      );
      element.find('a').on('click', function(e){
        e.preventDefault();
        scope.$apply(
          tabsaccordion.$scope.setStatus(attrs['ref'], true)
        );
      });
      tabsaccordion.$scope.$watch('statuses.' + attrs['ref'] + '', function (newValue, oldValue){
        scope.selected = tabsaccordion.$scope.getStatus(attrs['ref']);
      });
    },
    template: '<li ng-class="{\'tab-active\':selected}"><a href="#{{ref}}" ng-transclude></a></li>',
  };
})
.directive('tabcontent', ['$sce', function($sce) {
  return {
    scope: {
      ref: '@'
    },
    require: '^tabsaccordion',
    restrict: 'E',
    transclude: true,
    replace: true,
    link: function(scope, element, attrs, tabsaccordion) {
      scope.selected = false;
      element.find('a').on('click', function(e){
        e.preventDefault();
        scope.$apply(
          tabsaccordion.$scope.setStatus(attrs['ref'], true)
        );
      });
      scope.content = $sce.trustAsHtml(tabsaccordion.$scope.getContent(attrs['ref']));
      tabsaccordion.$scope.$watch('statuses.' + attrs['ref'] + '', function (newValue, oldValue){
        scope.selected = tabsaccordion.$scope.getStatus(attrs['ref']);
      });
    },
    template: '<div><div class="accordion-link" ng-class="{\'accordion-active\':selected}"><a href="#{{ref}}" ng-bind-html="content"></a></div><div ng-class="{\'tab-active\':selected, \'accordion-active\':selected}" class="tab-content" id="{{ref}}" ng-transclude></div></div>',
  };
}]);

angular.module('ngNephila.components.toggle',[])
.directive('toggle', ['$rootScope', function($rootScope) {
  return {
    scope: {
      state: '=',
    },
    link: function(scope, element, attrs) {
      var toggleClass = attrs.toggleClass;
      var toggleState = function() {
        scope.state = !scope.state;
      };
      if (!toggleClass) {
        toggleClass = 'active';
      }
      if (scope.state) {
        element.addClass(toggleClass);
      } else {
        element.removeClass(toggleClass);
      }
      element.bind('click', function() {
        element.toggleClass(toggleClass);
        if (scope.$$phase || $rootScope.$$phase) {
          scope.toggleState();
        } else {
          scope.$apply(toggleState);
        }
      });
    }
  };
}]);

(function(module) {
try {
  module = angular.module('ngNephila.tpls.datepicker.datepicker');
} catch (e) {
  module = angular.module('ngNephila.tpls.datepicker.datepicker', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('template/datepicker/datepicker.html',
    '<input type="text" ng-focus="showCalendar()" ng-value="viewValue" class="datepicker-input"placeholder="{{ placeholder }}"/>\n' +
    '<div class="datepicker" ng-show="calendarOpened">\n' +
    '  <div class="datepicker-controls">\n' +
    '    <div class="datepicker-previous">\n' +
    '      <i class="datepicker-prev-year" ng-click="prevYear()"></i>\n' +
    '      <i class="datepicker-prev-month" ng-click="prevMonth()"></i>\n' +
    '    </div>\n' +
    '    <span class="datepicker-date" ng-bind="dateValue"></span>\n' +
    '    <div class="datepicker-next">\n' +
    '      <i class="datepicker-next-month" ng-click="nextMonth()"></i>\n' +
    '      <i class="datepicker-next-year" ng-click="nextYear()"></i>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="datepicker-day-names">\n' +
    '    <span ng-repeat="dn in dayNames">\n' +
    '      {{ dn }}\n' +
    '    </span>\n' +
    '  </div>\n' +
    '  <div class="datepicker-calendar">\n' +
    '    <span ng-repeat="d in days" class="datepicker-day" ng-click="selectDate($event, d)" ng-class="{disabled: !d.enabled}">\n' +
    '      {{ d.day }}\n' +
    '    </span>\n' +
    '  </div>\n' +
    '</div>');
}]);
})();

(function(module) {
try {
  module = angular.module('ngNephila.tpls.modal.modal');
} catch (e) {
  module = angular.module('ngNephila.tpls.modal.modal', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('template/modal/modal.html',
    '<div class="overlay" ng-show="show" ng-click="hideModal();">\n' +
    '  <div class="overlay-content">\n' +
    '    <div class="modal" ng-transclude ng-click="$event.stopPropagation();">\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>');
}]);
})();

(function(module) {
try {
  module = angular.module('ngNephila.tpls.paginator.paginator');
} catch (e) {
  module = angular.module('ngNephila.tpls.paginator.paginator', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('template/paginator/paginator.html',
    '<ul>\n' +
    '  <li>\n' +
    '    <a href="" ng-click="paginator.prev()">{{prevLabel || "&lt;&lt;"}}</a>\n' +
    '  </li>\n' +
    '  <li ng-hide="canHide(i)" ng-class="{active: i == paginator.getCurrentPage()}" ng-repeat="i in pages">\n' +
    '    <a href="" ng-hide="isFirstCanHide(i)" ng-click="paginator.goToPage(i)">{{i}}</a>\n' +
    '    <span ng-show="isFirstCanHide(i)">{{compressLabel || "..."}}</span>\n' +
    '  </li>\n' +
    '  <li>\n' +
    '    <a href="" ng-click="paginator.next()">{{nextLabel || "&gt;&gt;"}}</a>\n' +
    '  </li>\n' +
    '</ul>');
}]);
})();

})();