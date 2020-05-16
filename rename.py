# !/usr/bin/python

import os
for root, dirs, files in os.walk("./mn/", topdown=True):
    for name in dirs:
        path = os.path.join(root, name)
        al = os.listdir(path)
        i = 0
        for file in al:
            i = i + 1
            old = path + '/' + file
            new = path + '/' + str(i) + '_img' +'.jpg'
            if i > 11:
                os.unlink(old)
                print('Delete: ' + old)
            else:
                os.rename(old, new)
                print('Rename: ' + old + ' - ' + new)

            

