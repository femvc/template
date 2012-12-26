template
========

A simple template parse tools. Only support some simple method, like import child. 
    
    bui.Template.parseTemplate('<!-- target:hello -->Hello ${name} ');
    bui.Template.parseTemplate('<!-- target:parent -->[I can say: "<!-- import:hello -->"]');
    
    alert(bui.Template.targetContainer['parent']); //[I can say: "Hello ${name}"] 

Order is not very important.
    
    bui.Template.parseTemplate('<!-- target:hello -->[Hi <!-- import:parent -->]');
    bui.Template.parseTemplate('<!-- target:parent -->(father)');
    bui.Template.parseTemplate('<!-- target:lound -->{Lound say: <!-- import:hello-->}');

    alert(bui.Template.targetContainer['lound']); //{Lound say: [Hi (father)]} 

When recycle-import.    
    
    bui.Template.parseTemplate('<!-- target:tom -->[ <!-- import:cat --> are bad.]');
    bui.Template.parseTemplate('<!-- target:cat -->( <!-- import:tom --> is wrong.)');
    
    alert(bui.Template.targetContainer['tom']); //[ ( <!-- import:tom --> is wrong. ) are bad.]
    alert(bui.Template.targetContainer['cat']); //( [ <!-- import:cat --> are bad.] is wrong. )');
    


    
