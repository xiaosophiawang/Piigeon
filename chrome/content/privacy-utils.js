/* See license.txt for terms of usage */
/**
 * This handles all utility functions called by other functions
 */
if (!piigeon) {
    var piigeon = {};
}

function getFetchIdForWin(win){// Get the browser for the given context
    win = piigeon.tab.getRootWindow(win);
    for (var i = 0; i < Firebug.InfoEscapeHttpMonitor.contexts.length; i++) {
        if (Firebug.InfoEscapeHttpMonitor.contexts[i].window == win) {
            return Firebug.InfoEscapeHttpMonitor.contexts[i].fetchId;
        }
    }
    return null;
};

piigeon.tab = {
    getTabForWindow: function(win){
        win = this.getRootWindow(win);
        
        if (!win || !gBrowser.getBrowserIndexForDocument) 
            return null;
        
        try {
            var targetDoc = win.document;
            
            var tab = null;
            var targetBrowserIndex = gBrowser.getBrowserIndexForDocument(targetDoc);
            
            if (targetBrowserIndex != -1) {
                tab = gBrowser.tabContainer.childNodes[targetBrowserIndex];
                return tab;
            }
        } 
        catch (ex) {
        }
        
        return null;
    },
    
    getTabIdForWindow: function(win){
        var tab = this.getTabForWindow(win);
        return tab ? tab.linkedPanel : null;
    },
    
    getRootWindow: function(win){
        for (; win; win = win.parent) {
            if (!win.parent || win == win.parent || !(win.parent instanceof Window)) 
                return win;
        }
        return null;
    }
};

// Handles all stupid stuffs
piigeon.utils = {
    // Constants
    charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    // Data URI which specifies the images of red/green/orange icons
    checkImageURI: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAKTWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9yntX167%2B3t%2B9f7vOec5/zOec8PgBESJpHmomoAOVKFPDrYH49PSMTJvYACFUjgBCAQ5svCZwXFAADwA3l4fnSwP/wBr28AAgBw1S4kEsfh/4O6UCZXACCRAOAiEucLAZBSAMguVMgUAMgYALBTs2QKAJQAAGx5fEIiAKoNAOz0ST4FANipk9wXANiiHKkIAI0BAJkoRyQCQLsAYFWBUiwCwMIAoKxAIi4EwK4BgFm2MkcCgL0FAHaOWJAPQGAAgJlCLMwAIDgCAEMeE80DIEwDoDDSv%2BCpX3CFuEgBAMDLlc2XS9IzFLiV0Bp38vDg4iHiwmyxQmEXKRBmCeQinJebIxNI5wNMzgwAABr50cH%2BOD%2BQ5%2Bbk4eZm52zv9MWi/mvwbyI%2BIfHf/ryMAgQAEE7P79pf5eXWA3DHAbB1v2upWwDaVgBo3/ldM9sJoFoK0Hr5i3k4/EAenqFQyDwdHAoLC%2B0lYqG9MOOLPv8z4W/gi372/EAe/tt68ABxmkCZrcCjg/1xYW52rlKO58sEQjFu9%2Bcj/seFf/2OKdHiNLFcLBWK8ViJuFAiTcd5uVKRRCHJleIS6X8y8R%2BW/QmTdw0ArIZPwE62B7XLbMB%2B7gECiw5Y0nYAQH7zLYwaC5EAEGc0Mnn3AACTv/mPQCsBAM2XpOMAALzoGFyolBdMxggAAESggSqwQQcMwRSswA6cwR28wBcCYQZEQAwkwDwQQgbkgBwKoRiWQRlUwDrYBLWwAxqgEZrhELTBMTgN5%2BASXIHrcBcGYBiewhi8hgkEQcgIE2EhOogRYo7YIs4IF5mOBCJhSDSSgKQg6YgUUSLFyHKkAqlCapFdSCPyLXIUOY1cQPqQ28ggMor8irxHMZSBslED1AJ1QLmoHxqKxqBz0XQ0D12AlqJr0Rq0Hj2AtqKn0UvodXQAfYqOY4DRMQ5mjNlhXIyHRWCJWBomxxZj5Vg1Vo81Yx1YN3YVG8CeYe8IJAKLgBPsCF6EEMJsgpCQR1hMWEOoJewjtBK6CFcJg4Qxwicik6hPtCV6EvnEeGI6sZBYRqwm7iEeIZ4lXicOE1%2BTSCQOyZLkTgohJZAySQtJa0jbSC2kU6Q%2B0hBpnEwm65Btyd7kCLKArCCXkbeQD5BPkvvJw%2BS3FDrFiOJMCaIkUqSUEko1ZT/lBKWfMkKZoKpRzame1AiqiDqfWkltoHZQL1OHqRM0dZolzZsWQ8ukLaPV0JppZ2n3aC/pdLoJ3YMeRZfQl9Jr6Afp5%2BmD9HcMDYYNg8dIYigZaxl7GacYtxkvmUymBdOXmchUMNcyG5lnmA%2BYb1VYKvYqfBWRyhKVOpVWlX6V56pUVXNVP9V5qgtUq1UPq15WfaZGVbNQ46kJ1Bar1akdVbupNq7OUndSj1DPUV%2Bjvl/9gvpjDbKGhUaghkijVGO3xhmNIRbGMmXxWELWclYD6yxrmE1iW7L57Ex2Bfsbdi97TFNDc6pmrGaRZp3mcc0BDsax4PA52ZxKziHODc57LQMtPy2x1mqtZq1%2BrTfaetq%2B2mLtcu0W7eva73VwnUCdLJ31Om0693UJuja6UbqFutt1z%2Bo%2B02PreekJ9cr1Dund0Uf1bfSj9Rfq79bv0R83MDQINpAZbDE4Y/DMkGPoa5hpuNHwhOGoEctoupHEaKPRSaMnuCbuh2fjNXgXPmasbxxirDTeZdxrPGFiaTLbpMSkxeS%2BKc2Ua5pmutG003TMzMgs3KzYrMnsjjnVnGueYb7ZvNv8jYWlRZzFSos2i8eW2pZ8ywWWTZb3rJhWPlZ5VvVW16xJ1lzrLOtt1ldsUBtXmwybOpvLtqitm63Edptt3xTiFI8p0in1U27aMez87ArsmuwG7Tn2YfYl9m32zx3MHBId1jt0O3xydHXMdmxwvOuk4TTDqcSpw%2BlXZxtnoXOd8zUXpkuQyxKXdpcXU22niqdun3rLleUa7rrStdP1o5u7m9yt2W3U3cw9xX2r%2B00umxvJXcM970H08PdY4nHM452nm6fC85DnL152Xlle%2B70eT7OcJp7WMG3I28Rb4L3Le2A6Pj1l%2Bs7pAz7GPgKfep%2BHvqa%2BIt89viN%2B1n6Zfgf8nvs7%2Bsv9j/i/4XnyFvFOBWABwQHlAb2BGoGzA2sDHwSZBKUHNQWNBbsGLww%2BFUIMCQ1ZH3KTb8AX8hv5YzPcZyya0RXKCJ0VWhv6MMwmTB7WEY6GzwjfEH5vpvlM6cy2CIjgR2yIuB9pGZkX%2BX0UKSoyqi7qUbRTdHF09yzWrORZ%2B2e9jvGPqYy5O9tqtnJ2Z6xqbFJsY%2BybuIC4qriBeIf4RfGXEnQTJAntieTE2MQ9ieNzAudsmjOc5JpUlnRjruXcorkX5unOy553PFk1WZB8OIWYEpeyP%2BWDIEJQLxhP5aduTR0T8oSbhU9FvqKNolGxt7hKPJLmnVaV9jjdO31D%2BmiGT0Z1xjMJT1IreZEZkrkj801WRNberM/ZcdktOZSclJyjUg1plrQr1zC3KLdPZisrkw3keeZtyhuTh8r35CP5c/PbFWyFTNGjtFKuUA4WTC%2BoK3hbGFt4uEi9SFrUM99m/ur5IwuCFny9kLBQuLCz2Lh4WfHgIr9FuxYji1MXdy4xXVK6ZHhp8NJ9y2jLspb9UOJYUlXyannc8o5Sg9KlpUMrglc0lamUycturvRauWMVYZVkVe9ql9VbVn8qF5VfrHCsqK74sEa45uJXTl/VfPV5bdra3kq3yu3rSOuk626s91m/r0q9akHV0IbwDa0b8Y3lG19tSt50oXpq9Y7NtM3KzQM1YTXtW8y2rNvyoTaj9nqdf13LVv2tq7e%2B2Sba1r/dd3vzDoMdFTve75TsvLUreFdrvUV99W7S7oLdjxpiG7q/5n7duEd3T8Wej3ulewf2Re/ranRvbNyvv7%2ByCW1SNo0eSDpw5ZuAb9qb7Zp3tXBaKg7CQeXBJ9%2BmfHvjUOihzsPcw83fmX%2B39QjrSHkr0jq/dawto22gPaG97%2BiMo50dXh1Hvrf/fu8x42N1xzWPV56gnSg98fnkgpPjp2Snnp1OPz3Umdx590z8mWtdUV29Z0PPnj8XdO5Mt1/3yfPe549d8Lxw9CL3Ytslt0utPa49R35w/eFIr1tv62X3y%2B1XPK509E3rO9Hv03/6asDVc9f41y5dn3m978bsG7duJt0cuCW69fh29u0XdwruTNxdeo94r/y%2B2v3qB/oP6n%2B0/rFlwG3g%2BGDAYM/DWQ/vDgmHnv6U/9OH4dJHzEfVI0YjjY%2BdHx8bDRq98mTOk%2BGnsqcTz8p%2BVv9563Or59/94vtLz1j82PAL%2BYvPv655qfNy76uprzrHI8cfvM55PfGm/K3O233vuO%2B638e9H5ko/ED%2BUPPR%2BmPHp9BP9z7nfP78L/eE8/sl0p8zAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2%2BSX8VGAAAIDElEQVR42uSXbXBU5RXHf/fe3Wx2774k2WSTQHaTbEIgIdHExCCgOKOCjNoWqm1qtWgZraCOLYOj0her1o4vUy2ttUqoMiKtI0WLWsE61amKtoEQggSC5m27yZJkl93sbu6%2B3H25tx%2BY6YydAcFxxg89X55Pz5nfc855zvkfQdd1vkoT%2BYrtKwcwfJFLuz%2B4e5GSCM%2BNx6OuXF4ttDtMabfbPeitbeypta5Pn4sv4Vxq4KEnb18ePDnUceGSmgGrzfi63W6lwCSRTM0wOTmJ/9/Tj4eD2cKLO7/7y66rNwa/NIDv39ewvapGjl%2B%2Bou3vbrf7L%2BlEjtnZWfK6gqZnQchSWlqKbLEzG8/wztsHHuo/6G9cu%2BaeNRc3njkinwuw6pbGbTfetPK51o7qD6ZCxwgGgxRIFioqKkikTpJMzVJULKMoCjOROM6SOTiLasmpdv7w7O5H6msu3HP3rZv3nTPAO0e3GB/91cZ/3HbH6qfq60tf%2BqjnLermzaGqqgqL0ILf78ciS9jtdpTZLAVGM4Ig4fP5OBE8zFyPjfJKK1u2vDbgrWrq2XTD0VvOCeCqtQ3b19157fd0aZrR0T5a2724Kmz4/X6EdD0lJSVoegpFURAFMwIGJMmIzWYjq5%2Bg99C76ILCggULeOWlg/suar3p52tWPvXuWQF03bNgW%2BfFlWP2EvVBRVFoXngecoFMeFqh0OgiEZOprKxEKzhCNBpFFAoxik5yiXoEQcDnP0ZtvYOZzFuMj49TXubh1T8fGHjlCb3lc/tA92u/rFVVVTabzQ/G43Ha29vx%2BXxEo1FMJhP5fB6r1Yrf7ycWi2EymUgmk2SzWTKZDL29vbS1tTE8PEw0GqWyspLh4WEuu2zRno2PXf2jz43ADZvaf9PUbrhr6uQR2jrqcblcmMVaxo4lcJdfghLPkkqpuN1ucvZtJJNJRFEkFArBTBct866jsX4hAB9%2B/DwHj%2BzEZI2h6zpvv3m4562tqYvOGIHp6WlPOp2mtrYWh8OBqqqEw2E8Hg/xeBxFUXA4HPh8PsLhMJqmMT4%2BjqIoNDU10VjfSDpzytfS85bi8XiYmZkhFArR2dn5tyf%2BeMfy0wL8%2BJn1V3pq5vfGY8WYDG0ooRrUk14ifpHBQyNMjg5i1CLMpo%2BTk44hphvQojVMDJSybP6TXFD9LYSsiEEHTYc8KuF4FNkpowgprF79/vc%2BfeGB0wJEIpFKk8n0cElJCWazGUVRGBwcpK6ujvXXr8fr9RIOhxEEAafTiaZpHD16lJtvvpkF7gWnciqAJJ06d7y6g0AgwJw5c/B6vfT391NWVhY4LcD09Mj5FjlLXjtBKhkkr2Vobm6mvWklCcpYecm9uBzLCQWPYxTzjPQ5ue6Kl6mx3k5WbSaamiRjGGY6%2BQY7/nobGaZY2NzGTNjG1GQOd3UVE1O%2BxtMCJBKJIlEUSSQShEIhwuEw13RegwEDIiJRJcqqb6zC4/Fw4MABVq9ejdfjBSCXA7vZTj6fZ%2B/evSSTSWpqajAajRiNRqLRKMlkkv/99Z8BKLJZ4ulMGDUXoqraznjgOL3%2BHiQc5HIlGKVyhLyFqzrv5I61T1BfcQWiZkTTQNMgyyRbXtxIPNeDe55GKO5j6mSIVEqjrLSBeEyhwHgGgLq6ukORSARZlgkEAixbtoydO3fSN9KHbJDR9VMvBTAbzKRSkEpBNguyDM889wx2u52GhgYCgQDpdBpJklBVlUwmQ0VFBYpyBoCF8zv3hKfV3bOxBFaLTEKZoW1RHS/v2sIR//vkTXnyBtBzCzFk2zBYkoiyH8l0jN/96QZiuY8ptBlRkiaMplIMJh01H6ak3Exw2s/UBLjLW987LcCNK%2B4OxuPxUpvNxujoKLIso6oqS5cupbu7m0gkglGCTAZ0HXR0NDQ2d29GFEWam5vJ5XL/7RWpVIry8nJGR0dRVZVIJPJGdXX1wBkbkbdy0Z6ZCStCxsro2Dj18xqZSX/CkhUuNm//OodP7MZgyUBBhhT9PPXCWuS5gzRcIHEi/Allc50U2q2k1TzFZTKBwDC%2B4SGqyhpRTrj8D39797NnBOjq6nr88OHDA5IkEYvFGBkZoby8HE3T6OjoYNeuXfgn/IiIbNu%2BDZvNhsvlYmhoiKamJsbGxhBFEYPBQDwex%2Bfz0dLSQiAQeLqlpWXfWU3DW%2B/92l2COe50ecz3j/gOsXRZO9XV1SipBLOzswQ%2BDWEx27EVObDKDgSjdGpAnRihzGUnp8WQJImPPuwll5QotbfxwdvHn31/18frz0oVb33sjd/29/dfmkwmH1q8eDH79%2B%2Bnr6%2BPbDaLxWKhtbUVh8OB0%2BlEEATS6TT5fB5d1xFFkUgkQk9PDw6Hg4aGBvbu3btv3bp1G85Zki25trnbXVccvHzl4p8MjR5ELjJRMdeG3aZiMpnIpecgUYyaOTUNbUU6oZMTJBMRiq12ZkIaL3a/OfDoA1tau1b8IP%2BFNOGS62t2mu26dF3Xim%2BOT41hMKlIYgSDwUCR9TyCk2k03QSArUhH01No%2BSQHPvrXexO%2B2aL7fvj4imuXnF4hn5Uq/tnWTW3P7/j9rzsWz%2B%2Bt8ZZttBdrlJSUkEglsVgsFBYWEgrOkFAyjAxNMT4SenV%2B7fnvvviL15/%2BUveCNY8s33R0cP%2BVqUzcabdLebNsOV9VVWZnMwMWsymdUDKF1e6mf6666juP3HrpT8e%2B9MXkM4W6dasUi8WcqqrKFoslvmHDhvAX8SP832/H/xkAzei%2BfznjEysAAAAASUVORK5CYII%3D",
    
    crossImageURI: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAKTWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9yntX167%2B3t%2B9f7vOec5/zOec8PgBESJpHmomoAOVKFPDrYH49PSMTJvYACFUjgBCAQ5svCZwXFAADwA3l4fnSwP/wBr28AAgBw1S4kEsfh/4O6UCZXACCRAOAiEucLAZBSAMguVMgUAMgYALBTs2QKAJQAAGx5fEIiAKoNAOz0ST4FANipk9wXANiiHKkIAI0BAJkoRyQCQLsAYFWBUiwCwMIAoKxAIi4EwK4BgFm2MkcCgL0FAHaOWJAPQGAAgJlCLMwAIDgCAEMeE80DIEwDoDDSv%2BCpX3CFuEgBAMDLlc2XS9IzFLiV0Bp38vDg4iHiwmyxQmEXKRBmCeQinJebIxNI5wNMzgwAABr50cH%2BOD%2BQ5%2Bbk4eZm52zv9MWi/mvwbyI%2BIfHf/ryMAgQAEE7P79pf5eXWA3DHAbB1v2upWwDaVgBo3/ldM9sJoFoK0Hr5i3k4/EAenqFQyDwdHAoLC%2B0lYqG9MOOLPv8z4W/gi372/EAe/tt68ABxmkCZrcCjg/1xYW52rlKO58sEQjFu9%2Bcj/seFf/2OKdHiNLFcLBWK8ViJuFAiTcd5uVKRRCHJleIS6X8y8R%2BW/QmTdw0ArIZPwE62B7XLbMB%2B7gECiw5Y0nYAQH7zLYwaC5EAEGc0Mnn3AACTv/mPQCsBAM2XpOMAALzoGFyolBdMxggAAESggSqwQQcMwRSswA6cwR28wBcCYQZEQAwkwDwQQgbkgBwKoRiWQRlUwDrYBLWwAxqgEZrhELTBMTgN5%2BASXIHrcBcGYBiewhi8hgkEQcgIE2EhOogRYo7YIs4IF5mOBCJhSDSSgKQg6YgUUSLFyHKkAqlCapFdSCPyLXIUOY1cQPqQ28ggMor8irxHMZSBslED1AJ1QLmoHxqKxqBz0XQ0D12AlqJr0Rq0Hj2AtqKn0UvodXQAfYqOY4DRMQ5mjNlhXIyHRWCJWBomxxZj5Vg1Vo81Yx1YN3YVG8CeYe8IJAKLgBPsCF6EEMJsgpCQR1hMWEOoJewjtBK6CFcJg4Qxwicik6hPtCV6EvnEeGI6sZBYRqwm7iEeIZ4lXicOE1%2BTSCQOyZLkTgohJZAySQtJa0jbSC2kU6Q%2B0hBpnEwm65Btyd7kCLKArCCXkbeQD5BPkvvJw%2BS3FDrFiOJMCaIkUqSUEko1ZT/lBKWfMkKZoKpRzame1AiqiDqfWkltoHZQL1OHqRM0dZolzZsWQ8ukLaPV0JppZ2n3aC/pdLoJ3YMeRZfQl9Jr6Afp5%2BmD9HcMDYYNg8dIYigZaxl7GacYtxkvmUymBdOXmchUMNcyG5lnmA%2BYb1VYKvYqfBWRyhKVOpVWlX6V56pUVXNVP9V5qgtUq1UPq15WfaZGVbNQ46kJ1Bar1akdVbupNq7OUndSj1DPUV%2Bjvl/9gvpjDbKGhUaghkijVGO3xhmNIRbGMmXxWELWclYD6yxrmE1iW7L57Ex2Bfsbdi97TFNDc6pmrGaRZp3mcc0BDsax4PA52ZxKziHODc57LQMtPy2x1mqtZq1%2BrTfaetq%2B2mLtcu0W7eva73VwnUCdLJ31Om0693UJuja6UbqFutt1z%2Bo%2B02PreekJ9cr1Dund0Uf1bfSj9Rfq79bv0R83MDQINpAZbDE4Y/DMkGPoa5hpuNHwhOGoEctoupHEaKPRSaMnuCbuh2fjNXgXPmasbxxirDTeZdxrPGFiaTLbpMSkxeS%2BKc2Ua5pmutG003TMzMgs3KzYrMnsjjnVnGueYb7ZvNv8jYWlRZzFSos2i8eW2pZ8ywWWTZb3rJhWPlZ5VvVW16xJ1lzrLOtt1ldsUBtXmwybOpvLtqitm63Edptt3xTiFI8p0in1U27aMez87ArsmuwG7Tn2YfYl9m32zx3MHBId1jt0O3xydHXMdmxwvOuk4TTDqcSpw%2BlXZxtnoXOd8zUXpkuQyxKXdpcXU22niqdun3rLleUa7rrStdP1o5u7m9yt2W3U3cw9xX2r%2B00umxvJXcM970H08PdY4nHM452nm6fC85DnL152Xlle%2B70eT7OcJp7WMG3I28Rb4L3Le2A6Pj1l%2Bs7pAz7GPgKfep%2BHvqa%2BIt89viN%2B1n6Zfgf8nvs7%2Bsv9j/i/4XnyFvFOBWABwQHlAb2BGoGzA2sDHwSZBKUHNQWNBbsGLww%2BFUIMCQ1ZH3KTb8AX8hv5YzPcZyya0RXKCJ0VWhv6MMwmTB7WEY6GzwjfEH5vpvlM6cy2CIjgR2yIuB9pGZkX%2BX0UKSoyqi7qUbRTdHF09yzWrORZ%2B2e9jvGPqYy5O9tqtnJ2Z6xqbFJsY%2BybuIC4qriBeIf4RfGXEnQTJAntieTE2MQ9ieNzAudsmjOc5JpUlnRjruXcorkX5unOy553PFk1WZB8OIWYEpeyP%2BWDIEJQLxhP5aduTR0T8oSbhU9FvqKNolGxt7hKPJLmnVaV9jjdO31D%2BmiGT0Z1xjMJT1IreZEZkrkj801WRNberM/ZcdktOZSclJyjUg1plrQr1zC3KLdPZisrkw3keeZtyhuTh8r35CP5c/PbFWyFTNGjtFKuUA4WTC%2BoK3hbGFt4uEi9SFrUM99m/ur5IwuCFny9kLBQuLCz2Lh4WfHgIr9FuxYji1MXdy4xXVK6ZHhp8NJ9y2jLspb9UOJYUlXyannc8o5Sg9KlpUMrglc0lamUycturvRauWMVYZVkVe9ql9VbVn8qF5VfrHCsqK74sEa45uJXTl/VfPV5bdra3kq3yu3rSOuk626s91m/r0q9akHV0IbwDa0b8Y3lG19tSt50oXpq9Y7NtM3KzQM1YTXtW8y2rNvyoTaj9nqdf13LVv2tq7e%2B2Sba1r/dd3vzDoMdFTve75TsvLUreFdrvUV99W7S7oLdjxpiG7q/5n7duEd3T8Wej3ulewf2Re/ranRvbNyvv7%2ByCW1SNo0eSDpw5ZuAb9qb7Zp3tXBaKg7CQeXBJ9%2BmfHvjUOihzsPcw83fmX%2B39QjrSHkr0jq/dawto22gPaG97%2BiMo50dXh1Hvrf/fu8x42N1xzWPV56gnSg98fnkgpPjp2Snnp1OPz3Umdx590z8mWtdUV29Z0PPnj8XdO5Mt1/3yfPe549d8Lxw9CL3Ytslt0utPa49R35w/eFIr1tv62X3y%2B1XPK509E3rO9Hv03/6asDVc9f41y5dn3m978bsG7duJt0cuCW69fh29u0XdwruTNxdeo94r/y%2B2v3qB/oP6n%2B0/rFlwG3g%2BGDAYM/DWQ/vDgmHnv6U/9OH4dJHzEfVI0YjjY%2BdHx8bDRq98mTOk%2BGnsqcTz8p%2BVv9563Or59/94vtLz1j82PAL%2BYvPv655qfNy76uprzrHI8cfvM55PfGm/K3O233vuO%2B638e9H5ko/ED%2BUPPR%2BmPHp9BP9z7nfP78L/eE8/sl0p8zAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2%2BSX8VGAAAHx0lEQVR42uyXa3CU1RmAn73fL18uu2YTCJHEBAhKUgSlYA0UBVGhxlaqY52KVkWZijfGmbYalEJpO7a1FWxn2iqOtcN4HYvGDsaglnJLCMRACAlJMNlsdrPZ3ezt%2B3a/7/RH/KHTYuNlxh/tO3P%2Bvec9zzvv9eiEEHyVoucrlv8DGD%2BLcnjzD7/eHWlr6O0/tGylpFeFEKiqajKbzdnmhGawm2ecWFS9bLf/0Sf3TdWmbipJ2LGjqfLYM6/eXlUd6Ft4Ve1O3exi6NgHqdSkgtUKM2ph1EjvgaFrjxw6OT9TG%2Bi75XcvPvOFAbqXV%2B%2BMTQxWLnz8nmVkEoR7TpFIJPDNrCYUCuHz%2Bchms2jxMTKZDBVzasHsYHz3u08Mn0165rT0rvvcADsuX/jY6gLVELhywcOHTrRQ7JMoLytF5/UCRrR8fjKRDAbITIDRSGdbOzlFUFdxKfLRgXtf7E56btz3/ubPDNB6YfXO6ZJmqLiq5rbU4cPkFtXjveBr0BEGIaBEj6ooGKxWlFQKM36YmIBaL4wO8uHzuylraCDZkfxx%2B8kx/5JjXRumXAUv33n1HW63O1oxb95tw3v34jjvPLzl5Rx98006X3kFFAVVUdDr9aDXYy4qglCI3jfe4K1du8DloqyxkdNvvImzrOyxoqKi4b//4Fu3ThnAtKf5xjpH9OHh5pcJXHM1LF7C8dcsmLUrqd3RzAsRN4aRNLq0EUIZODXCtiPjTPvJn7li%2Ba94Yftp8BVRuW4d/a2vEdD3/dT5bst12uaH6v4rwN9uangoEAgMnDnVR2DBAjRVpaO1FZfLxez774eSEtauX8/ptjZyvb1gsXCwuZkNGzZgnjcPlixh7e2389ennoJUihmXXMLg4BDl5eWr9uzZc8u/eSuE%2BMQ5YrG2BKucIndlgRCblghx92LRu6peZLWEyChCKFkhREIIMdEmntx4tdi4eraIHv6LELIQqbgQaVkTeZEWomm9GL2uQojHvylGri8SykxJjHr8r6tNTRUff%2B8TjSjy220Bu90%2BoaoZjMXFk3Vu8qCqKsFgEF%2BhA6tJj5LQMFsF9zzwAOPBINLcuZAHuwNUg45kJgnHjyNJEsTjSJKEyZokn1dW9fX1PV0JZ/5jCIZaDi%2B/QLZfU6p4odhLWlVIZ8epqvNz5oaV2Dv3M6L0IBfL4KxHKbwMqX4tmOaQtecZlrsxnO4gcusNjOYHyTn0BHMpsj4vaF5KFAvR9hMN58yBeDxeIMsyGI1omQxWqxW73w8mEw3Ll/PO5s0YjUZMmMjnwWjUfXQvDYDT7uToli3YbDaq6uuxud2YTCYURQFZBpOJVCrlOidAxqTXMqoGGQOZnA29uRhyZhA2QGVxYSHv3bwRaziCzghCD%2BMJDafHjnUiyeiWHWjHOwnUVJIfl8FdgsNaQjZlhgkNMiqKyxY7J4Asyxab3gZ6PVarlfFoFFmW0XI5UFV6enpYc9ddYDAQj6sAuN0fmchmqbz%2BeioqKuDsWYySRC4WI5FIYDAYwOlEE8qn94H4TN%2BHwuVByevRZDu6pAVdjw59eDrbDp7E/UgTXLQIXDYy3jADuQFCuhAhXQjcdghUIT3xa/6U0MFxA7oPgJgOl%2BoGo40kRoZ91vg5AWbNmnVEluW9wXCQaDSKt7gYc0kJ3fv3s2nTJkoXLgSdDlIp7NiRzBJyTsaGDQwGyGZBkvj%2B1q0M9PZiNJnweDzkcjnyQ0MoKBQUFIycE2D%2BfU3dr/lT4USZC//BPhhIkf6wE3VpKcr8UjRLEuFMI9w6pK4Qye9tpGfRWqSDvaTlCAlzDBwK%2BDWm3baYrg/exzqsQ/rHAH22LO9Ns%2B9aPP8br35qJ7TZbOl4PD7pUTSKvaaGYDBIe3s7erMVVVXR6Y0Mbd9OJBLhihUraLn3XvL5PG6PRHIiRioWo7m5mdlLl0I2y1BXHzabDU3TDIX33xf%2BVIDVGzbcF/MXPn8il%2BHYyU4QBpbVzCV712Pw899j7BxksPEWkgMd1F04HSbO0nBROV0rvgN7D%2BBsG6Bt6U2sDFSAy01/x1GctdUcMuZ3l69a/vyUxnFr/ewnA2OjZV6vd01IS1O77DJw%2Buj8ZxtWm4NYLMb8xmuhp2dyNNtsoDPT%2BvbbeD1OLrq4HrQEp1vewxLN4HZJvBUbe%2Bnbg%2BHGKe8Dj8wsenn19Jlr6oM68sEzGG9aDGVuVC2JwW6HM8nJMLlckM%2BT1I%2BRzWYpml0Hh/vhpYMgLPRcUMDrI4Mv3PDgg3cH7tgYnTJA5g%2B/KG7e9svfrMn7cvg9N5%2BUT6GWuZlRV43D44GIDhyOyXlhtYIrCyYTPfsOEDsywMXnXwZnw7SqoV1V323cEdjyxP7PtRP%2Bsbzm2apovnjJpTNXkBohq8QwF3lIzKmlv78fv99PIpGgdHCA9MgYvuJpUDaX7rb%2Bp1sToYLaO6/buujR7e1faCseqV/5s0jXOwuKfLbL/dOLUB1mwpVV5PN5ZFkGoOzsIFajjWxwnO4TI/sy3vMjl4S7Gr%2BUtRzg/dd3mg4899ym9LGuBXPwXFM7XkgkEkGSJJLJJEecQcaKLK9Y5tW0Vy5b%2BczqdT8a%2BNL%2BBR%2BX/LPb/eqxgVmWw7EF42NjAYPBkHO73dH4PEe7rqb0jHt9U/dnsaf7n/8d/2sA9ZKj0QzdYzAAAAAASUVORK5CYII%3D",
    
    questImageURI: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABcSAAAXEgFnn9JSAAAKTWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9yntX167%2B3t%2B9f7vOec5/zOec8PgBESJpHmomoAOVKFPDrYH49PSMTJvYACFUjgBCAQ5svCZwXFAADwA3l4fnSwP/wBr28AAgBw1S4kEsfh/4O6UCZXACCRAOAiEucLAZBSAMguVMgUAMgYALBTs2QKAJQAAGx5fEIiAKoNAOz0ST4FANipk9wXANiiHKkIAI0BAJkoRyQCQLsAYFWBUiwCwMIAoKxAIi4EwK4BgFm2MkcCgL0FAHaOWJAPQGAAgJlCLMwAIDgCAEMeE80DIEwDoDDSv%2BCpX3CFuEgBAMDLlc2XS9IzFLiV0Bp38vDg4iHiwmyxQmEXKRBmCeQinJebIxNI5wNMzgwAABr50cH%2BOD%2BQ5%2Bbk4eZm52zv9MWi/mvwbyI%2BIfHf/ryMAgQAEE7P79pf5eXWA3DHAbB1v2upWwDaVgBo3/ldM9sJoFoK0Hr5i3k4/EAenqFQyDwdHAoLC%2B0lYqG9MOOLPv8z4W/gi372/EAe/tt68ABxmkCZrcCjg/1xYW52rlKO58sEQjFu9%2Bcj/seFf/2OKdHiNLFcLBWK8ViJuFAiTcd5uVKRRCHJleIS6X8y8R%2BW/QmTdw0ArIZPwE62B7XLbMB%2B7gECiw5Y0nYAQH7zLYwaC5EAEGc0Mnn3AACTv/mPQCsBAM2XpOMAALzoGFyolBdMxggAAESggSqwQQcMwRSswA6cwR28wBcCYQZEQAwkwDwQQgbkgBwKoRiWQRlUwDrYBLWwAxqgEZrhELTBMTgN5%2BASXIHrcBcGYBiewhi8hgkEQcgIE2EhOogRYo7YIs4IF5mOBCJhSDSSgKQg6YgUUSLFyHKkAqlCapFdSCPyLXIUOY1cQPqQ28ggMor8irxHMZSBslED1AJ1QLmoHxqKxqBz0XQ0D12AlqJr0Rq0Hj2AtqKn0UvodXQAfYqOY4DRMQ5mjNlhXIyHRWCJWBomxxZj5Vg1Vo81Yx1YN3YVG8CeYe8IJAKLgBPsCF6EEMJsgpCQR1hMWEOoJewjtBK6CFcJg4Qxwicik6hPtCV6EvnEeGI6sZBYRqwm7iEeIZ4lXicOE1%2BTSCQOyZLkTgohJZAySQtJa0jbSC2kU6Q%2B0hBpnEwm65Btyd7kCLKArCCXkbeQD5BPkvvJw%2BS3FDrFiOJMCaIkUqSUEko1ZT/lBKWfMkKZoKpRzame1AiqiDqfWkltoHZQL1OHqRM0dZolzZsWQ8ukLaPV0JppZ2n3aC/pdLoJ3YMeRZfQl9Jr6Afp5%2BmD9HcMDYYNg8dIYigZaxl7GacYtxkvmUymBdOXmchUMNcyG5lnmA%2BYb1VYKvYqfBWRyhKVOpVWlX6V56pUVXNVP9V5qgtUq1UPq15WfaZGVbNQ46kJ1Bar1akdVbupNq7OUndSj1DPUV%2Bjvl/9gvpjDbKGhUaghkijVGO3xhmNIRbGMmXxWELWclYD6yxrmE1iW7L57Ex2Bfsbdi97TFNDc6pmrGaRZp3mcc0BDsax4PA52ZxKziHODc57LQMtPy2x1mqtZq1%2BrTfaetq%2B2mLtcu0W7eva73VwnUCdLJ31Om0693UJuja6UbqFutt1z%2Bo%2B02PreekJ9cr1Dund0Uf1bfSj9Rfq79bv0R83MDQINpAZbDE4Y/DMkGPoa5hpuNHwhOGoEctoupHEaKPRSaMnuCbuh2fjNXgXPmasbxxirDTeZdxrPGFiaTLbpMSkxeS%2BKc2Ua5pmutG003TMzMgs3KzYrMnsjjnVnGueYb7ZvNv8jYWlRZzFSos2i8eW2pZ8ywWWTZb3rJhWPlZ5VvVW16xJ1lzrLOtt1ldsUBtXmwybOpvLtqitm63Edptt3xTiFI8p0in1U27aMez87ArsmuwG7Tn2YfYl9m32zx3MHBId1jt0O3xydHXMdmxwvOuk4TTDqcSpw%2BlXZxtnoXOd8zUXpkuQyxKXdpcXU22niqdun3rLleUa7rrStdP1o5u7m9yt2W3U3cw9xX2r%2B00umxvJXcM970H08PdY4nHM452nm6fC85DnL152Xlle%2B70eT7OcJp7WMG3I28Rb4L3Le2A6Pj1l%2Bs7pAz7GPgKfep%2BHvqa%2BIt89viN%2B1n6Zfgf8nvs7%2Bsv9j/i/4XnyFvFOBWABwQHlAb2BGoGzA2sDHwSZBKUHNQWNBbsGLww%2BFUIMCQ1ZH3KTb8AX8hv5YzPcZyya0RXKCJ0VWhv6MMwmTB7WEY6GzwjfEH5vpvlM6cy2CIjgR2yIuB9pGZkX%2BX0UKSoyqi7qUbRTdHF09yzWrORZ%2B2e9jvGPqYy5O9tqtnJ2Z6xqbFJsY%2BybuIC4qriBeIf4RfGXEnQTJAntieTE2MQ9ieNzAudsmjOc5JpUlnRjruXcorkX5unOy553PFk1WZB8OIWYEpeyP%2BWDIEJQLxhP5aduTR0T8oSbhU9FvqKNolGxt7hKPJLmnVaV9jjdO31D%2BmiGT0Z1xjMJT1IreZEZkrkj801WRNberM/ZcdktOZSclJyjUg1plrQr1zC3KLdPZisrkw3keeZtyhuTh8r35CP5c/PbFWyFTNGjtFKuUA4WTC%2BoK3hbGFt4uEi9SFrUM99m/ur5IwuCFny9kLBQuLCz2Lh4WfHgIr9FuxYji1MXdy4xXVK6ZHhp8NJ9y2jLspb9UOJYUlXyannc8o5Sg9KlpUMrglc0lamUycturvRauWMVYZVkVe9ql9VbVn8qF5VfrHCsqK74sEa45uJXTl/VfPV5bdra3kq3yu3rSOuk626s91m/r0q9akHV0IbwDa0b8Y3lG19tSt50oXpq9Y7NtM3KzQM1YTXtW8y2rNvyoTaj9nqdf13LVv2tq7e%2B2Sba1r/dd3vzDoMdFTve75TsvLUreFdrvUV99W7S7oLdjxpiG7q/5n7duEd3T8Wej3ulewf2Re/ranRvbNyvv7%2ByCW1SNo0eSDpw5ZuAb9qb7Zp3tXBaKg7CQeXBJ9%2BmfHvjUOihzsPcw83fmX%2B39QjrSHkr0jq/dawto22gPaG97%2BiMo50dXh1Hvrf/fu8x42N1xzWPV56gnSg98fnkgpPjp2Snnp1OPz3Umdx590z8mWtdUV29Z0PPnj8XdO5Mt1/3yfPe549d8Lxw9CL3Ytslt0utPa49R35w/eFIr1tv62X3y%2B1XPK509E3rO9Hv03/6asDVc9f41y5dn3m978bsG7duJt0cuCW69fh29u0XdwruTNxdeo94r/y%2B2v3qB/oP6n%2B0/rFlwG3g%2BGDAYM/DWQ/vDgmHnv6U/9OH4dJHzEfVI0YjjY%2BdHx8bDRq98mTOk%2BGnsqcTz8p%2BVv9563Or59/94vtLz1j82PAL%2BYvPv655qfNy76uprzrHI8cfvM55PfGm/K3O233vuO%2B638e9H5ko/ED%2BUPPR%2BmPHp9BP9z7nfP78L/eE8/sl0p8zAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2%2BSX8VGAAAHzUlEQVR42uyXa4xdVRXHf/uce%2B5r7p1nOyPtzLSlhT6m0jciSGhJMSgvaf1gotEQgsRAgp8kMRH94CMhKESNaIyIkIhFSMFHAUUEYqXTAtJ3Sx9MO9NOZ%2B7MvXOf57X3Xn64k0ZIL%2BKnfnGdnJyzv5z1W2uvvc5/KRHhYprDRbaLDpD4z0X52M7z7yJCUC2STOdoHBn2Mj19G8q7tt9ppo5d7Xl%2Bv5eXrJvUiAgSKKK604gSvSe8eWv%2B6XqpJ%2BIw2J29/BM2OPEWqm8xmXU3ku5dgOiIznzvhQEuYEpEuk2t%2BI3Jlx%2B%2Bq2O%2B7eq8xiM1EOHkI0hpsKB8F11SueBkaVX53YOrapXeLd7QLY9j7cOgJgH5SBl4n2fA%2BrVLSy88%2BjM1%2BdqnF362l8zHq1j3HMGER3Ash/bzgMLL%2BWT6KmQ3Ctl1GRpvl/oKbz12f/nU%2Bg2ZJVfeJ6iDrSDeB6AcBxEBa7FhY37llV//MtfYuWn%2BHf2o%2BacJJiKm31wCyS2kF20m27cIBMLJk0wfeQmHZ5hz5WlyN3h4fSmm/jZ8fXV/7efpTV%2B5G6UOXjBSETl/h40x6qXjTAw/mzn50zsee%2B/rnsi%2BFSIFJdFRJad%2BsV6Kb%2B%2BXC5mJRQqvvSBjjy8QM4LIuCfhnzNy6j4lh753%2B7PnTh/snvFnKFUm3ufT%2BQANiChpVG4L92%2B7Y%2BD2y6DvOFJLUntnAenF99O1ZiUAJvRpnDpE5ehubBzgJKBz3Sa8vnupHVWQikkus8xZ45EcffEmf/i5e1Qi6WDthx9DGwftpR0PfeuS9d24CwtI3UVG1xJPLCB72WpEICoXmPrLjylt%2Bzz1HXcy9fJPEBESbSmyC68hmOpCGgqrLd6cNB0f81Phm09vDfe%2BvtKbGnNaA1ibLO9/4%2BakPbu044oUMIMdG0L5faQ6DdW9z1Mf2Ufhj9/BOfko81Zl6e4PMWP/IG5EzQ9mstiJHqI9acIDefSMQ2bQI8XBIf%2BdF7eKDua2BIgLI/PCt5/f2rmwzSVXw07Ng0ovuCH5gS6SE09R2f4lOp1dzN2wAiFNbdrDmbeRZFsKay3B2WM4ugh%2BDuoJrAEnlSCb0wl9eufGxuGXNrUEqL6x/SqZPjqU6csgRiFTl6CcGBGLAnpWLGDeJy%2BlbXAAWw2YGSkTtN9C98a7EREax/fS2P0Ima4QlUyBI83TJ5DMAP7E4urh4RtaAlSO7NvguOEcN6uQah4JUogKEWsQE0PDR/wYCRvUzs3QyN1E79Yf4LVlCc6cZOavD9DGLjK9PZhYEASUIBZcT%2BGYYk84evjylgD%2B2aMLE55pV66DrWcQFTWjF42YGCsabIQJKvhhN13X34uXUkQzBYqv/pB0/U%2B0LxpEhwpEg1gEQayglMIhSktY7mxdhNUzriIC4yGBCyoCMYjRYGJER2AjbOijMnNJtvcg1lDdtwM18gRdSwfQJoHoGMQCghKLMgJGUMoAsde6FWe7jbFKiA0oB5RCJEYci5q9rAGsAVNHjEZXKgQHnqSz38E6OcSvo2g2GaS5BdZYiASUKzipqGUGUpesGDWhUzNRgKAR0WANYmOwMdbGiNXggROME5Ym8cffxS0Pk57bi/F9UAbEzDa15lPFgonASDpwUh3FlgDdqzcPG5ufiotFFLNptxHKaKzRiNFYG6OUwvPKVPb8lvqbT5DvdZFYzWbGNOExgEVigwoNJgTrdk2l%2B5cfaQnQvvpTexI9iw83xmaQsA40o7c2QmwTRnQESkh3aOTAQzhnfkd6bgcmisFqRAxiLIjBioWGRSIhjkA6Bg%2B3rd70YksAN985kl55w/ZqwRVTKGJ1BNhmRZsIZSIgwsYB/ozGbZ%2BPtC2hfEYjxgdlEWua2yYG8TUqMNgI/DgZpgbWvdK2aM3rH9KKjU4uvfYPun3FgerpBhSnsHE0m06DYFAmwp8sU5VN5G57lvwt2/Czt1I7U0Q5YdMxGvFjqGiUFRoV0Pm1e9vXfGZ7IpNvXQMRHqIotl3/1QdLpbY4mqzBVAFbq2FtBEpjdYOg5tG24S7yi5fTtvByOq%2B7h3o9hwkrKAxSi5GSJoEQ%2B1CtZRru0M3bEvOXvouY1n/Dikpjcu0k19/4lLfq9ienz3rYGR%2BKRex0GVOrIzpGORF6%2BiRag9GWcPIELgZ8i50JkbLGVYKJoXTOtXrRrb9PX7H5V1GtTESytSJyELACJjDtq2/8ZmlqvGdy/PXb5vTGuFENW3NRKZe01VR2/YjpqIHjQvCv35C1VagCQYybBBNBcRSigZt2dGy5//tue2c5COqIypH/gOg8v5g4e2hWmFic48PomcJg5cjwg97o3z/X3lFOpbOz/cmBqAZ%2BHXASpJOadCdY2xR%2BQQWq5Yyxi25%2BrnPLtx9wB5YeCsb2o9xmE%2BwbXPlRVLGAiU%2B3X731a8HIsgOlvc98IR2cGMpkBS8FXl7hZQWsRnmKWAtRA3zfIVBLjjnLrt7evfGLj2QuHRqvT483qf8XVXxeolld6rxu63fr2Fd14diXi4Xj1yRq7y3xHD/pes3smVgR27SxXv8p8v2veoNrn8osv%2BplPT2KtdLS%2BUeZC0AE26jieu6e3NrN0dTeTKlxqHCtEzb6XE8MKHSMkmS63HbZsp3Z%2BcufDsJwt/XLOO5/H7zU/4fTiw3w7wEAQhGdl1OuGgUAAAAASUVORK5CYII%3D",

    domainSuffix: new Array('ac', 'ad', 'ae', 'aero', 'af', 'ag', 'ai', 'al', 'am', 'an', 'ao', 'aq', 'ar', 'arpa', 'as', 'asia', 'at', 'au', 'aw', 'ax', 'az', 'ba', 'bb', 'bd', 'be', 'bf', 'bg', 'bh', 'bi', 'biz', 'bj', 'bm', 'bn', 'bo', 'br', 'bs', 'bt', 'bv', 'bw', 'by', 'bz', 'ca', 'cat', 'cc', 'cd', 'cf', 'cg', 'ch', 'ci', 'ck', 'cl', 'cm', 'cn', 'co', 'com', 'coop', 'cr', 'cu', 'cv', 'cx', 'cy', 'cz', 'de', 'dj', 'dk', 'dm', 'do', 'dz', 'ec', 'edu', 'ee', 'eg', 'er', 'es', 'et', 'eu', 'fi', 'fj', 'fk', 'fm', 'fo', 'fr', 'ga', 'gb', 'gd', 'ge', 'gf', 'gg', 'gh', 'gi', 'gl', 'gm', 'gn', 'gov', 'gp', 'gq', 'gr', 'gs', 'gt', 'gu', 'gw', 'gy', 'hk', 'hm', 'hn', 'hr', 'ht', 'hu', 'id', 'ie', 'il', 'im', 'in', 'info', 'int', 'io', 'iq', 'ir', 'is', 'it', 'je', 'jm', 'jo', 'jobs', 'jp', 'ke', 'kg', 'kh', 'ki', 'km', 'kn', 'kp', 'kr', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'li', 'lk', 'lr', 'ls', 'lt', 'lu', 'lv', 'ly', 'ma', 'mc', 'md', 'me', 'mg', 'mh', 'mil', 'mk', 'ml', 'mm', 'mn', 'mo', 'mobi', 'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'museum', 'mv', 'mw', 'mx', 'my', 'mz', 'na', 'name', 'nc', 'ne', 'net', 'nf', 'ng', 'ni', 'nl', 'no', 'np', 'nr', 'nu', 'nz', 'om', 'org', 'pa', 'pe', 'pf', 'pg', 'ph', 'pk', 'pl', 'pm', 'pn', 'pr', 'pro', 'ps', 'pt', 'pw', 'py', 'qa', 're', 'ro', 'rs', 'ru', 'rw', 'sa', 'sb', 'sc', 'sd', 'se', 'sg', 'sh', 'si', 'sj', 'sk', 'sl', 'sm', 'sn', 'so', 'sr', 'st', 'su', 'sv', 'sy', 'sz', 'tc', 'td', 'tel', 'tf', 'tg', 'th', 'tj', 'tk', 'tl', 'tm', 'tn', 'to', 'tp', 'tr', 'travel', 'tt', 'tv', 'tw', 'tz', 'ua', 'ug', 'uk', 'us', 'uy', 'uz', 'va', 'vc', 've', 'vg', 'vi', 'vn', 'vu', 'wf', 'ws', 'xn', 'xxx', 'ye', 'yt', 'za', 'zm', 'zw'),
    
    isNotDomainSuffix: function(s){
        for (var i = 0; i < piigeon.utils.domainSuffix.length; i++) {
            if (s == piigeon.utils.domainSuffix[i]) {
                return false;
            }
        }
        return true;
    },
    
    // find the name of the site given the host of the url
    findSite: function(host){
        if (host == null) 
            return "";
        
		// filter out special characters
		if (host[host.length - 1] == '.')
			host = host.substring(0, host.length - 1);
		
        var temp = host.split(".");
		
		// if ip address
		if (temp.length == 4){
			var ch = true;
			for (var ii=0;ii<4;ii++){
				if (!parseInt(temp[ii], 10)){
					ch = false;
					break;
				}
				//	continue;
				if (parseInt(temp[ii], 10).toString != temp[ii]){
					ch = false;
					break;
				}
			}
			if (ch)
				return host;
		}
		
        var Site = "";
		// common cases
        var t = false;
        var i = temp.length;
        while (!t) {
            if (i <= 0) 
                break;
            i = i - 1;
            t = piigeon.utils.isNotDomainSuffix(temp[i]);
            if (t) {
                Site = temp[i];
                for (var j = i + 1; j < temp.length; j++) {
                    Site = Site + "." + temp[j];
                }
            }
        }
        return Site;
    },
    
	genGuid: function(charset, len, isNotInDOM) {
    	var i = 0;
    	if (! charset) {charset = this.charset;}
    	if (! len) {len = 8;}
    	var id = '', charsetlen = charset.length, charIndex;

    	// iterate on the length and get a random character for each position
    	for (i = 0; len > i; i += 1) {
	        charIndex = Math.random() * charsetlen;
        	id += charset.charAt(charIndex);
    	}
		return id;
	},
	
    hashElement: function(element){
        var feature = "";
        try {
            feature += "tagName=" + element.tagName + "\t";
        } 
        catch (e) {
        }
        try {
            feature += "type=" + element.type + "\t";
        } 
        catch (e) {
        }
        try {
            feature += "id=" + element.id + "\t";
        } 
        catch (e) {
        }
        try {
            feature += "name=" + element.name + "\t";
        } 
        catch (e) {
        }
        /*
         try {
         feature += element.value + "\n";
         }
         catch (e) {
         }*/
        try {
            feature += "onclick=" + element.onclick + "\t";
        } 
        catch (e) {
        }
        return feature;
    },
    
    
    patternMatch: function(HttpHandle, confItem){
        // match Url
        piigeonText = (HttpHandle.Name == "Out") ? HttpHandle.Url : "";
        if (piigeonText != "" && piigeonText) {
            if (confItem.Content != "") {
                var allMatchedPattern = piigeonText.match(confItem.Pattern);
                HttpHandle.FromUrl = allMatchedPattern ? true : false;
            }
        }
        
        // match Referrer
        piigeonText = (HttpHandle.Name == "Out") ? HttpHandle.Referrer : "";
        if (piigeonText != "" && piigeonText) {
            if (confItem.Content != "") {
                var allMatchedPattern = piigeonText.match(confItem.Pattern);
                HttpHandle.FromReferrer = allMatchedPattern ? true : false;
            }
        }
        
        // match Cookie
        piigeonText = (HttpHandle.Name == "Out") ? HttpHandle.GetCookie : HttpHandle.SetCookie;
        if (piigeonText != "" && piigeonText) {
            if (confItem.Content != "") {
                var allMatchedPattern = piigeonText.match(confItem.Pattern);
                HttpHandle.FromCookie = allMatchedPattern ? true : false;
            }
        }
        
        // match Data
        piigeonText = HttpHandle.Data;
        if (piigeonText != "" && piigeonText) {
            if (confItem.Content != "") {
                var allMatchedPattern = piigeonText.match(confItem.Pattern);
                HttpHandle.FromData = allMatchedPattern ? true : false;
            }
        }
        
        if (HttpHandle.FromUrl || HttpHandle.FromReferrer || HttpHandle.FromCookie || HttpHandle.FromData) {
            return HttpHandle;
        }
        
        return null;
    },
    
    elapsedTime: function(t_1, t_2){
		var stringsBundle = document.getElementById("string-bundle");
        
		t_1 = t_1.toString();
		t_2 = t_2.toString();
		
		
        var t = t_1.split(" ");
        var time_1 = {
            month: t[1],
            date: t[2],
            year: t[3]
        };
        t = t_2.split(" ");
        var time_2 = {
            month: t[1],
            date: t[2],
            year: t[3]
        };
		
		time_1.date =  (time_1.date[0] == '0') ? time_1.date[1] : time_1.date;
		time_2.date =  (time_2.date[0] == '0') ? time_2.date[1] : time_2.date;
		
        t = {};
        t.year = parseInt(time_2.year, 10) - parseInt(time_1.year, 10);
        t.month = parseInt(this.monthMap(time_2.month), 10) - parseInt(this.monthMap(time_1.month), 10);
        t.date = parseInt(time_2.date, 10) - parseInt(time_1.date, 10);

        if (t.date < 0) {
            t.date += this.leapYear(parseInt(time_1.year, 10), parseInt(this.monthMap(time_1.month), 10));
            t.month = t.month - 1;
        }
        if (t.month < 0) {
            t.month += 12;
            t.year = t.year - 1;
        }
        
        if (t.year > 0) {
            if (t.year > 1) 
                return t.year + stringsBundle.getString('string_years_ago');
            else 
                return t.year + stringsBundle.getString('string_year_ago');
        }
        if (t.month > 0) {
            if (t.month > 1) 
                return t.month + stringsBundle.getString('string_months_ago');
            else 
                return t.month + stringsBundle.getString('string_month_ago');
        }
        if (t.date > 0) {
            var week = Math.floor(t.date / 7);
            if (week > 0) {
				if (week > 1) 
					return week + stringsBundle.getString('string_weeks_ago');
				else 
					return week + stringsBundle.getString('string_week_ago');
			}
			else {
				if (t.date > 1) 
					return t.date + stringsBundle.getString('string_days_ago');
				else 
					return stringsBundle.getString('string_yesterday');
			}
        }
        return stringsBundle.getString('string_today');
    },

    compareTime: function(t_1, t_2){
		t_1 = t_1.toString();
		t_2 = t_2.toString();
        var t = t_1.split(" ");
        var time_1 = {
            month: t[1],
            date: t[2],
            year: t[3],
            hour: t[4].split(":")[0],
            minute: t[4].split(":")[1],
            second: t[4].split(":")[2]
        };
        t = t_2.split(" ");
        var time_2 = {
            month: t[1],
            date: t[2],
            year: t[3],
            hour: t[4].split(":")[0],
            minute: t[4].split(":")[1],
            second: t[4].split(":")[2]
        };
        
		
		time_1.date =  (time_1.date[0] == '0') ? time_1.date[1] : time_1.date;
		time_2.date =  (time_2.date[0] == '0') ? time_2.date[1] : time_2.date;
		time_1.hour =  (time_1.hour[0] == '0') ? time_1.hour[1] : time_1.hour;
		time_2.hour =  (time_2.hour[0] == '0') ? time_2.hour[1] : time_2.hour;
		time_1.minute =  (time_1.minute[0] == '0') ? time_1.minute[1] : time_1.minute;
		time_2.minute =  (time_2.minute[0] == '0') ? time_2.minute[1] : time_2.minute;
		time_1.second =  (time_1.second[0] == '0') ? time_1.second[1] : time_1.second;
		time_2.second =  (time_2.second[0] == '0') ? time_2.second[1] : time_2.second;
		
		
        t = {};
        t.year = parseInt(time_2.year, 10) - parseInt(time_1.year, 10);
        t.month = parseInt(this.monthMap(time_2.month), 10) - parseInt(this.monthMap(time_1.month), 10);
        t.date = parseInt(time_2.date, 10) - parseInt(time_1.date, 10);
        t.hour = parseInt(time_2.hour, 10) - parseInt(time_1.hour, 10);
        t.minute = parseInt(time_2.minute, 10) - parseInt(time_1.minute, 10);
        t.second = parseInt(time_2.second, 10) - parseInt(time_1.second, 10);
        
        if (t.second < 0) {
            t.second += 60;
            t.minute = t.minute - 1;
        }
        if (t.minute < 0) {
            t.minute += 60;
            t.hour = t.hour - 1;
        }
        if (t.hour < 0) {
            t.hour += 60;
            t.date = t.date - 1;
        }
        if (t.date < 0) {
            t.date += this.leapYear(parseInt(time_1.year, 10), parseInt(this.monthMap(time_1.month), 10));
            t.month = t.month - 1;
        }
        if (t.month < 0) {
            t.month += 12;
            t.year = t.year - 1;
        }
		
		if (t.year >= 0)
			return t_2;
		else
			return t_1;
    },

	// if (t_2 - t_1 > offsetDays) return true; else return false;
    compareTimeOffset: function(t_1, t_2, offsetDays){
		t_1 = t_1.toString();
		t_2 = t_2.toString();
        var t = t_1.split(" ");
        var time_1 = {
            month: t[1],
            date: t[2],
            year: t[3],
            hour: t[4].split(":")[0],
            minute: t[4].split(":")[1],
            second: t[4].split(":")[2]
        };
        t = t_2.split(" ");
        var time_2 = {
            month: t[1],
            date: t[2],
            year: t[3],
            hour: t[4].split(":")[0],
            minute: t[4].split(":")[1],
            second: t[4].split(":")[2]
        };
        
		
		time_1.date =  (time_1.date[0] == '0') ? time_1.date[1] : time_1.date;
		time_2.date =  (time_2.date[0] == '0') ? time_2.date[1] : time_2.date;
		
        t = {};
        t.year = parseInt(time_2.year, 10) - parseInt(time_1.year, 10);
        t.month = parseInt(this.monthMap(time_2.month), 10) - parseInt(this.monthMap(time_1.month), 10);
        t.date = parseInt(time_2.date, 10) - parseInt(time_1.date, 10) - offsetDays;

		var calcYear = parseInt(time_1.year, 10);
		var calcMonth = parseInt(this.monthMap(time_1.month), 10);
		if (calcMonth == 1) {
			calcMonth = 12;
			calcYear = calcYear - 1;
		}
        while (t.date < 0) {
            t.date += this.leapYear(calcYear, calcMonth);
            t.month = t.month - 1;
			calcMonth = calcMonth - 1;
			if (calcMonth == 1) {
				calcMonth = 12;
				calcYear = calcYear - 1;
			}
        }
        while (t.month < 0) {
            t.month += 12;
            t.year = t.year - 1;
        }
		
		if (t.year >= 0)
			return true;
		else
			return false;
    },

	// sanitizeType:
	// 0 - Clear everything
	// 1 - Last Hour
	// 2 - Last 2 Hours
	// 3 - Last 4 Hours
	// 4 - Today
    compareTimeSanitize: function(t_1, t_2, sanitizeType){
		// 0 - Clear everything
		if (sanitizeType == 0)
			return true;
		
		t_1 = t_1.toString();
		t_2 = t_2.toString();
        var t = t_1.split(" ");
        var time_1 = {
            month: t[1],
            date: t[2],
            year: t[3],
            hour: t[4].split(":")[0],
            minute: t[4].split(":")[1],
            second: t[4].split(":")[2]
        };
        t = t_2.split(" ");
        var time_2 = {
            month: t[1],
            date: t[2],
            year: t[3],
            hour: t[4].split(":")[0],
            minute: t[4].split(":")[1],
            second: t[4].split(":")[2]
        };
        
		time_1.date =  (time_1.date[0] == '0') ? time_1.date[1] : time_1.date;
		time_2.date =  (time_2.date[0] == '0') ? time_2.date[1] : time_2.date;
		time_1.hour =  (time_1.hour[0] == '0') ? time_1.hour[1] : time_1.hour;
		time_2.hour =  (time_2.hour[0] == '0') ? time_2.hour[1] : time_2.hour;
		time_1.minute =  (time_1.minute[0] == '0') ? time_1.minute[1] : time_1.minute;
		time_2.minute =  (time_2.minute[0] == '0') ? time_2.minute[1] : time_2.minute;
		time_1.second =  (time_1.second[0] == '0') ? time_1.second[1] : time_1.second;
		time_2.second =  (time_2.second[0] == '0') ? time_2.second[1] : time_2.second;
		
        t = {};
        t.year = parseInt(time_2.year, 10) - parseInt(time_1.year, 10);
        t.month = parseInt(this.monthMap(time_2.month), 10) - parseInt(this.monthMap(time_1.month), 10);
        t.date = parseInt(time_2.date, 10) - parseInt(time_1.date, 10);
        t.hour = parseInt(time_2.hour, 10) - parseInt(time_1.hour, 10);
        t.minute = parseInt(time_2.minute, 10) - parseInt(time_1.minute, 10);
        t.second = parseInt(time_2.second, 10) - parseInt(time_1.second, 10);
        
		// 4 - Today: years, months, dates of them should be exactly the same.
		if (sanitizeType == 4){
			if (t.date == 0 && t.month == 0 && t.year == 0)
				return true;
			else
				return false;
		}
		
        if (t.second < 0) {
            t.second += 60;
            t.minute = t.minute - 1;
        }
        if (t.minute < 0) {
            t.minute += 60;
            t.hour = t.hour - 1;
        }
        if (t.hour < 0) {
            t.hour += 60;
            t.date = t.date - 1;
        }
        if (t.date < 0) {
            t.date += this.leapYear(parseInt(time_1.year, 10), parseInt(this.monthMap(time_1.month), 10));
            t.month = t.month - 1;
        }
        if (t.month < 0) {
            t.month += 12;
            t.year = t.year - 1;
        }
		
		if (!t.date == 0 || !t.month == 0 || !t.year == 0)
			return false;
		
		// 1 - Last Hour
		// 2 - Last 2 Hours
		// 3 - Last 4 Hours
		switch (sanitizeType) {
			case 1:
				if (t.hour < 1)
					return true;
				else
					return false;
			case 2:
				if (t.hour < 2)
					return true;
				else
					return false;
			case 3:
				if (t.hour < 4)
					return true;
				else
					return false;
			default:
				return false;
		}
		
		return false;
    },
	
    monthMap: function(text) {
    	// it has already been converted
    	if (text.toString().length < 3)
    		return text;
    	
        switch (text) {
            case "Jan":
                return 1;
            case "Feb":
                return 2;
            case "Mar":
                return 3;
            case "Apr":
                return 4;
            case "May":
                return 5;
            case "Jun":
                return 6;
            case "Jul":
                return 7;
            case "Aug":
                return 8;
            case "Sep":
                return 9;
            case "Oct":
                return 10;
            case "Nov":
                return 11;
            case "Dec":
                return 12;
            default:
                return 0;
        }
        return 0;
    },
	
	leapYear: function(year, month) {
		switch (month) {
			case 1:
				return 31;
			case 2:
				if ((year % 400 == 0) || (year % 100 != 0) && (year % 4 == 0))
					return 29;
				else
					return 28;
			case 3:
				return 31;
			case 4:
				return 30;
			case 5:
				return 31;
			case 6:
				return 30;
			case 7:
				return 31;
			case 8:
				return 31;
			case 9:
				return 30;
			case 10:
				return 31;
			case 11:
				return 30;
			case 12:
				return 31;
			default:
				return 30;
		}
		return 30;
	},
	
	timeNum2Text: function(number, capital) {
		var stringsBundle = document.getElementById("string-bundle");
		if (capital) {
			switch (number) {
				case 1:
					return stringsBundle.getString('string_once');
				case 2:
					return stringsBundle.getString('string_twice');
				default:
					return number + stringsBundle.getString('string_times');
			}
		}
		else {
			switch (number) {
				case 1:
					return stringsBundle.getString('string_once');
				case 2:
					return stringsBundle.getString('string_twice');
				default:
					return number + stringsBundle.getString('string_times');
			}
		}
	},
    
    askLocation: function(){
        var values = piigeon.wireless.values;
        
        // no wireless AP detected -> on a wired network
        if (values.length == 0) 
            return;
        
        var check = true;
        for (var i = 0; i < values.length; i++) {
            var loc = piigeon.dbController.selectWirelessUser(values[i].mac);
            if (loc.length == 0) 
                continue;
            check = false;
            break;
        }
        
        // location not in record, popup to ask users
        if (check) {
            window.openDialog('chrome://piigeon/content/WirelessLocation.xul', '', 'chrome,centerscreen', values);
        }
        
    },
	
	sample: function(s) {
		return s.substring(Math.floor(s.length / 2), s.length);
	},
	
	checkVisibility: function(node){
		
        if (node.tagName) {
            var tagName = new String(node.tagName).toLowerCase();
            if (tagName == "input") {
                if (node.type) {
                    var nodeType = new String(node.type).toLowerCase();
                    if (nodeType == "hidden") {
                        return false;
                    }
                }
            }
        }
        
        var visibility = piigeon.utils.findEffectiveStyleProperty(node, "visibility");
        var isDisplayed = piigeon.utils.isDisplayed(node);
        return (visibility != "hidden" && isDisplayed);
	},
    
    findEffectiveStyle: function(element){
        if (element.style == undefined) {
            return undefined; // not a styled element
        }
        var window = gBrowser.selectedBrowser.contentWindow;
        if (window.getComputedStyle) {
            // DOM-Level-2-CSS
            return window.getComputedStyle(element, null);
        }
        
        if (window.document.defaultView && window.document.defaultView.getComputedStyle) {
            return window.document.defaultView.getComputedStyle(element, null);
        }
    },
    
    findEffectiveStyleProperty: function(element, property){
        var effectiveStyle = piigeon.utils.findEffectiveStyle(element);
        var propertyValue = effectiveStyle[property];
        if (propertyValue == 'inherit' && element.parentNode.style) {
            return piigeon.utils.findEffectiveStyleProperty(element.parentNode, property);
        }
        return propertyValue;
    },
    
    isDisplayed: function(element){
        var display = piigeon.utils.findEffectiveStyleProperty(element, "display");
        
        if (display == "none") 
            return false;
        if (element.parentNode.style) 
            return piigeon.utils.isDisplayed(element.parentNode);
        
        return true;
    }
};
