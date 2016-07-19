/* globals CSInterface, cep, SystemPath */
'use strict';

angular.module('codemill.adobe', [])
  .service('cmAdobeService', ['$window', '$q', '$log',
    function ($window, $q, $log) {
      var csInterface = new CSInterface();
      var hostAvailable = typeof csInterface.openURLInDefaultBrowser !== "undefined";

      function evalCSScriptDefer(script, returnIsObject) {
        var deferred = $q.defer();
        try {
        csInterface.evalScript(script, function (data) {
            if (typeof returnIsObject === "undefined" || returnIsObject === null || returnIsObject !== true) {
                deferred.resolve(data)
            }
            else {
                if(typeof data !== "undefined" && data !== null)
                {
                    try {
                      var json;
                      if (typeof JSON !== 'object') {
                          json = Function("return " + data + "")();
                      } else {
                          json = JSON.parse(data);
                      }
                        deferred.resolve(json);
                    } catch (error) {
                        $log.debug(error);
                        if(typeof data === "undefined" || data === null || typeof script === "undefined" || script === null)
                        {
                            deferred.reject(error);
                        }else {
                            deferred.reject({ error: error, data: (data + ': ' + script) });
                        }

                    }
                } else {
                    deferred.reject("Not found");
                }

            }
        });
        } catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
      }

      function variableAsString(variable) {
        return typeof variable === 'undefined' ? 'undefined' :
          (variable === null ? 'null' : '\'' + variable + '\'');
      }

      var callToScript = function(callOpts) {
        var call = callOpts.method + '(';
        if (callOpts.args && callOpts.args.length > 0) {
          var first = true;
          for (var i = 0; i < callOpts.args.length; i++) {
            if (!first) {
              call += ', ';
            }
            var arg = callOpts.args[i];
            if (typeof arg === 'object') {
              arg = JSON.stringify(arg);
            }
            call += variableAsString(arg);
            first = false;
          }
        }
        call += ')';
        return call;
      };

      this.callCS = function(callOpts) {
        if (hostAvailable) {
          return evalCSScriptDefer(callToScript(callOpts), callOpts.returnsObject);
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
          if (typeof pathType === 'undefined' || pathType === null) {
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
          return csInterface.getSystemPath(type) + pathSeparator().replace(/\\/g, '/');
        }
      };

      this.getFilePath = function (config) {
        if (typeof config === 'undefined' || config === null) {
          return config;
        }
          $log.debug("config: ", config);
        var base = null;
        switch(config.pathType) {
          case 'null':
            return null;
          case 'full':
            if (hostAvailable) {
              cep.fs.makedir(config.filePath);
            }
            return config.filePath;
        case 'custom extension':
            return config.filePath.replace(/\\/g, '/');
          default:
            base = getBase(config.pathType);
            break;
        }
        var filePath = base + config.filePath;
        if (!config.isFile) {
          if (hostAvailable) {
            cep.fs.makedir(filePath);
            filePath += pathSeparator();
          } else {
            filePath += '/';
          }
        }
        $log.info('File path ' + filePath);
        return filePath.replace(/\\/g, '/');
      };

      this.isHostAvailable = function () {
        return hostAvailable;
      };
      
      this.getHost = function () {
        if (hostAvailable) {
          return csInterface.getHostEnvironment();
        } else {
          return {appId : "PPRO"};
        }
      };

      this.openDirectoryDialog = function(title, initialPath) {
        if (hostAvailable) {
          return cep.fs.showOpenDialog(false, true, title, initialPath);
        }
        return '';
      };

        this.showOpenDialogEx = function(title) {
            if (hostAvailable) {
                return cep.fs.showOpenDialogEx(false, false, title, "~", ["epr"], "", "OK")
            };
        };
        
        this.showOpenDialogFile = function (title, fileTypes) {
            if (hostAvailable) {
                return cep.fs.showOpenDialogEx(false, false, title, "~", fileTypes, "", "OK")
            };
        };
    }]);
