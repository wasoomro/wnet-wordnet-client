from flask import Flask, render_template
import json


app = Flask(__name__)

maxKey = 0
db_root = None
db_index = None
db_data = None
firstVal = 0
term_count = 0

appTemplate = None

templateDict = {
    "pcount" : "{{current_page}} of {{total_pages}}",
    "list_item_tag" : "{{list_item.substr(0,23)}}",
    "current_term" : "{{current_term}}",
    "current_type" : "{{current_type}}",
    "w_cat" : "{{current_cat}}",
    "data_key" : "{{data_key}}",
    "temp_data" : "{{temp_data}}",
    "isMultiSpeak" : "false"
}

"""isMultiSpeak if false, only words would spoken and if true
Examples, Definitions , Synonyms , Antonyms , all could spoken
"""


def getListIndex(page_number):
    global term_count

    start_index = (page_number-1)*term_count
    temp = maxKey-start_index
    end_index = start_index+ (temp if temp<(term_count-1)else term_count)

    return [db_index[i] for i in range(start_index,end_index)]



def getLowIndex(input_term):
    #Using "Binary Search" to search IOB BTREE for autocomplete
    # Customized One because built-in module for binary search (aka bisect) doesn't work for Btrees 
    low_index = 0 ; high_index = maxKey
    
    left_obj = firstVal
    right_obj = db_index[high_index]

    if (left_obj <= input_term and input_term <= right_obj):
        while(
            ( not ( left_obj.startswith(input_term) ) 
            ) and (input_term <= right_obj) and ( (high_index-low_index) > 1 )
            ):
            mid_index = (low_index+high_index)//2
            mid_obj = db_index[mid_index]

            if input_term <= mid_obj:
                high_index = mid_index
                right_obj = mid_obj
            else:
                #i>m
                low_index = mid_index
                left_obj = mid_obj
        
        if left_obj<input_term:
            low_index += 1
        
        return low_index 

    else:
        return 0



@app.route("/")
def index():
    global appTemplate
    if not appTemplate:
        appTemplate = render_template("index.html", **templateDict)
    return appTemplate

@app.route("/search/<search_term>")
def search(search_term):
    term_index = getLowIndex (search_term)
    temp = maxKey - term_index+1
    if temp>6: temp = 7


    return json.dumps([ db_index[term_index+i]
                        for i in range(temp)
                        if db_index[term_index+i].startswith(search_term)
                        ]
                        )


@app.route("/data/<data_term>")
def getTermData(data_term):
    
    term_data = {}

    for key, val in db_data.items():
        # add term_data if present in current object 
        try:
            term_data[key] = val[data_term]
        except:
            pass

    return json.dumps( term_data )


@app.route("/termsinitial/<list_c>")
def terms_initial(list_c):
    global term_count
    term_count = int(list_c)
    return json.dumps({ 
        "total_terms":  maxKey+1,
        "terms" : getListIndex(1)
    })

@app.route("/pagedata/<page_number>")
def pageData(page_number):
    return json.dumps( getListIndex( int(page_number) ) )


if __name__=="__main__":
    
    import ZODB.FileStorage as zfs
    import ZODB.DB as DB
    import zc.zlibstorage as zcs

    db = DB(zcs.ZlibStorage( zfs.FileStorage("db\\data.fs") ))
    conn = db.open()
    db_root = conn.root()
    db_index = db_root["index"]
    db_data = db_root["db_data"]
    maxKey = db_index.maxKey()
    firstVal = db_index[0]
    app.run()
    