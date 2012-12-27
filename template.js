'use strict';
//    ____     ____                _   _     ____          ____      ____                   
//  /\  __\  /\  __\    /'\_/`\  /\ \/\ \  /\  __`\      /\  __`\  /\  __`\    /'\_/`\      
//  \ \ \_/_ \ \ \_/_  /\      \ \ \ \ \ \ \ \ \ \_\     \ \ \ \_\ \ \ \ \ \  /\      \     
//   \ \  __\ \ \  __\ \ \ \_/\_\ \ \ \ \ \ \ \ \  __     \ \ \  __ \ \ \ \ \ \ \ \_/\_\    
//    \ \ \_/  \ \ \_/_ \ \ \\ \ \ \ \ \_/ \ \ \ \_\ \  __ \ \ \_\ \ \ \ \_\ \ \ \ \\ \ \   
//     \ \_\    \ \____/ \ \_\\ \_\ \ `\___/  \ \____/ /\_\ \ \____/  \ \_____\ \ \_\\ \_\  
//      \/_/     \/___/   \/_/ \/_/  `\/__/    \/___/  \/_/  \/___/    \/_____/  \/_/ \/_/  
//                                                                                          
//                                                                                          
/*
 * BUI(Baidu UI Library)
 * Copyright 2011 Baidu Inc. All rights reserved.
 *
 * path:    demo.js
 * desc:    BUI是一个富客户端应用的前端MVC框架[源于ER框架]
 * author:  Baidu FE
 * date:    2012/01/01 [用python脚本自动维护]
 */

var bui = {};
window.bui = bui;
/** 
 * 为对象绑定方法和作用域
 * @param {Function|String} handler 要绑定的函数，或者一个在作用域下可用的函数名
 * @param {Object} obj 执行运行时this，如果不传入则运行时this为函数本身
 * @param {args* 0..n} args 函数执行时附加到执行时函数前面的参数
 *
 * @returns {Function} 封装后的函数
 */
bui.fn = function(func, scope){
    if(Object.prototype.toString.call(func)==='[object String]'){func=scope[func];}
    if(Object.prototype.toString.call(func)!=='[object Function]'){ throw 'Error "bui.fn()": "func" is null';}
    var xargs = arguments.length > 2 ? [].slice.call(arguments, 2) : null;
    return function () {
        var fn = '[object String]' == Object.prototype.toString.call(func) ? scope[func] : func,
            args = (xargs) ? xargs.concat([].slice.call(arguments, 0)) : arguments;
        return fn.apply(scope || fn, args);
    };
};

/**  
 * 简易模板解析器 
 * 
 实现功能: 
 1. 将字符串解析成模板
 2. 自动解析模版嵌套
 3. 模版初步解析过程中不解析${variable}
 * @targetContainer {Map} 解析后的模版列表
 * 
 * @comment
 */
bui.Template = {
    /**
     * 解析前 originTargetContainer, 解析后 targetContainer
     */
    originTargetContainer:{},
    targetContainer:{},
    targetRule : /<!--\s*target:\s*([a-zA-Z0-9]+)\s*-->/g,
    importRule : /<!--\s*import:\s*([a-zA-Z0-9]+)\s*-->/g,
    /**
     * 根据模板url列表载入相应HTML模板文件
     * 
     * @param {string} tplList 模板文件URL列表
     *             
     * @returns void
     */
    loadTemplate: function(){
        var me = this, i, len,
            tplList = bui.config.TEMPLATE_LIST;
        
        for (i=0,len=tplList.length; i<len; i++){
            if(tplList[i]){
                Requester.get(tplList[i],'',bui.Template.callback);
            }
        }
    },
    /**
     * 模板加载回调事件接口
     * 
     * @public
     */
    callback: function(text){
        bui.config.loadedCount++;
        
        bui.Template.parseTemplate(text);
        if(bui.config.loadedCount >= bui.config.TEMPLATE_LIST.length){
            bui.Template.onload();
        }
    },
    /**
     * 模板加载完毕外部事件接口
     * 
     * @public
     */
    onload: function(callback){callback&&callback();},
    /**
     * 解析模板字符串流[增加target]
     * 
     * @param {string} tplStr 模板字符串流tpl:<!-- target:mergeTest -->hello ${myName}!
     * @param {Object|string...} opts 提供相应数据的对象或多个字符串
     *             
     * @returns {string} 格式化后的字符串
     */
    parseTemplate:function(tplStr, lazyParse){
        var me = this,
            i,
            len,
            k,
            targetNameList,
            targetContentList,
            targetList,
            sep;
        
        //基本思路: 使用正则提取targetName与targetContent分别放入两个数组
        tplStr = !tplStr ? '' : String(tplStr);
        
        //坑爹的String.split(RegExp)有兼容性问题!!!
        //找到一个不重复的字符串做分隔符
        sep = String(Math.random()).replace('.','');
        for( i=0; tplStr.indexOf(sep)>-1 && i<1000; i++){sep = String(Math.random()).replace('.','');}
        if (tplStr.indexOf(sep)>-1) { throw { title: 'BUI Template Error: ',name: 'Math.random()'} }
        
        targetList = {};
        targetNameList = tplStr.match(me.targetRule)||[],
        targetContentList = tplStr.replace(me.targetRule,sep).split(sep);
        
        if (targetContentList.length-targetNameList.length==1) { targetContentList.shift(); }
        if (targetContentList.length != targetNameList.length) { throw { title: 'BUI Template Error: ', name: 'Methond "parseTemplate()" error.'} }
        
        for (i=0,len=targetNameList.length;i<len;i++){
            k = targetNameList[i].replace(me.targetRule,'$1');
            targetList[k] = targetContentList[i];
            
            //存入全局target容器(targetContainer中的后面将会替换)
            me.originTargetContainer[k] = targetContentList[i];
        }
        
        if (lazyParse !== true) {
            me.parseAllTarget();
        }
        
        return targetList;
    },
    /**
     * 获取Target
     * 
     * @param {string} targetName Target名字
     *             
     * @returns {string} 未解析的target
     */
    getTarget: function(targetName){
        var me = this;
        if(targetName == null || targetName == '') return '';
        
        if(me.targetContainer[targetName] === undefined) 
            me.error('Target "'+targetName+'" not exist.');
        
        return me.targetContainer[targetName];
    },
    /**
     * 依赖于me.originTargetContainer循环解析targetList中的target
     * 
     * @param {string} tplStr 模板字符串流tpl:<!-- target:mergeTest -->hello ${myName}!
     * @param {Object|string...} opts 提供相应数据的对象或多个字符串
     *             
     * @returns {string} 格式化后的字符串
     */
    parseAllTarget: function(){
        var me = this,
            parsedTargetList = {},
            i,
            len,
            list,
            j,
            completeTargetName,
            v,
            parseTargetFinish = false,
            listSize,
            targetList;
        /**
         * 解析所有target
         */
        targetList = {};
        for(i in me.originTargetContainer){
            if (!i || !me.originTargetContainer[i]) continue;
            targetList[i] = me.originTargetContainer[i]; 
        }
        
        for (i in me.originTargetContainer) {
            if (!i || !me.originTargetContainer[i]) continue;
            v = me.originTargetContainer[i];
            for (j in targetList){
                if (!j || !targetList[j] || i == j) continue;
                targetList[j] = targetList[j].replace(new RegExp("<!--\\\s*import\\\s*:\\\s*("+i+")\\\s*-->","g"),v);
            }
        }
        
        me.targetContainer = targetList;
        
        return targetList;
    },
    /**
     * 合并模板与数据
     *
     * @public
     * @param {HTMLElement} targetContent  原始模板内容.
     * @param {Object}      model    数据模型
     * @return {String} 替换掉${varName}变量后的模板内容.
     */
    merge: function(targetContent, model) {
        var me = this;
        model = model||{};
        targetContent = targetContent||'';
        targetContent = String(targetContent).replace(
            /\$\{([\.:a-z0-9_]+)\}/ig,
            function($0, $1) {
                $1 = $1 == null ? '' : String($1);
                var varName = $1.replace(/:[a-z]+$/i, ''),
                    variable = model[varName];
                
                // 默认读取model中的,没有再到全局context中取,防止强耦合.
                if (variable === undefined && bui && bui.context && bui.context.get) { 
                    variable = bui.context.get(varName);
                }
                //预留根据变量类型读取,便于后期扩展格式${userName:lang}
                var varType = $1.match(/:([a-z]+)$/);
                if (varType && varType.length > 1 && me.parseVariableByType) {
                    return me.parseVariableByType(varName, varType[1]);
                }
                return (variable !== undefined && variable !== null) ? variable : '';
            }
        );
        return targetContent.toString();
    },
    /**
     * 解析带有类型的模板变量的值
     *
     * @private
     * @param {string} varName 变量名.
     * @param {string} type 变量类型，暂时为lang|config.
     * @return {string}
     */
    parseVariableByType: function(varName, type) {
        var packs = varName.split('.'),
            len = packs.length,
            variable,
            isFirst = true;

        type = type.toLowerCase();

        if (len == 1 && bui && bui[type]) {
            variable = bui[type][packs[0]];
        } 
        else {
            variable = window;
            while (len--) {
                variable = variable[packs[0]];
                packs.shift();
                if (isFirst) {
                    variable = variable[type];
                    isFirst = false;
                }
            }
        }

        return variable||'';
    },
    error:function(msg){
        msg = 'Template: ' + msg;
        if(window.console) {
            window.console.log(msg);
        }
        else throw Error(msg);
    }
};
