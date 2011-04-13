import mailbox
import json

# path to you sent mail mbox
mb = mailbox.mbox('Sent Mail')

fout = file('sent.json', 'w')
items = []
fields = ['date', 'subject', 'to']

for i in range(len(mb)):
    obj = {}
    for item in mb.get_message(i).items():
        if item[0].lower() in fields:
            obj[item[0]] = item[1]
    items.append(obj)
    mb.remove(i)

json.dump(items, fout)
fout.close()
