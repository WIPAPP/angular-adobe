'use strict';

angular.module('codemill.adobe', [])
  .service('cmAdobeService', ['$window', '$q', '$log',
    function ($window, $q, $log) {
      var csInterface = new CSInterface();
      var hostAvailable = typeof(csInterface.openURLInDefaultBrowser) !== 'undefined';

      function evalCSScriptDefer(script, returnIsObject) {
        var deferred = $q.defer();
        csInterface.evalScript(script, function(data) {
          deferred.resolve(returnIsObject ? JSON.parse(data) : data);
        });
        return deferred.promise();
      }

      function variableAsString(variable) {
        return variable === undefined ? 'undefined' :
          (variable === null ? 'null' : '\'' + variable + '\'');
      }

      var callToScript = function(callOpts) {
        var call = callOpts.method + '(';
        if (callOpts.args.length > 0) {
          var first = true;
          for (var i = 0; i < callOpts.args.length; i++) {
            if (!first) {
              call += ', ';
            }
            call += variableAsString(arguments[i]);
            first = false;
          }
        }
        call += ')';
        return call;
      };

      this.callCS = function(callOpts, returnIsObject) {
        if (hostAvailable) {
          return evalCSScriptDefer(callToScript(callOpts), returnIsObject);
        } else {
          return $q.when();
        }
      };

      this.registerEventListener = function(eventId, callback) {
        if (hostAvailable) {
          csInterface.addEventListener(eventId, callback);
        }
      };

      this.openURLInDefaultBrowser = function (url) {
        if (hostAvailable) {
          csInterface.openURLInDefaultBrowser(url);
        } else {
          $window.open(url);
        }
      };

      var pathSeparator = function () {
        var OSVersion = csInterface.getOSInformation();
        if (OSVersion.indexOf('Mac') >= 0) {
          return '/';
        } else {
          return '\\';
        }
      };

      var getBase = function(pathType) {
        if (!hostAvailable) {
          if (pathType === undefined || pathType === null) {
            pathType = 'documents';
          }
          return '/tmp/' + pathType + '/';
        } else {
          var type;
          switch(pathType) {
            case 'documents':
              type = SystemPath.MY_DOCUMENTS;
              break;
            case 'extension':
              type = SystemPath.EXTENSION;
              break;
            case 'userdata':
              type = SystemPath.USER_DATA;
              break;
            default:
              type = SystemPath.MY_DOCUMENTS;
              break;
          }
          return csInterface.getSystemPath(type) + pathSeparator();
        }
      };

      this.getFilePath = function (config) {
        if (config === undefined || config === null) {
          return config;
        }
        var base = null;
        switch(config.pathType) {
          case 'null':
            return null;
          case 'full':
            return config.filePath;
          default:
            base = getBase(config.pathType);
            break;
        }
        var filePath = base + config.filePath;
        if (hostAvailable) {
          cep.fs.makedir(filePath);
        }
        if (!config.isFile) {
          if (hostAvailable) {
            filePath += pathSeparator();
          } else {
            filePath += '/';
          }
        }
        $log.info('File path ' + filePath);
        return filePath;
      };

      this.isHostAvailable = function () {
        return hostAvailable;
      };

      this.openDirectoryDialog = function(title, initialPath) {
        if (hostAvailable) {
          return cep.fs.showOpenDialog(false, true, title, initialPath);
        }
        return '';
      };

    }]);
