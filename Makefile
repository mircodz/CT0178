.PHONY: all
all: gallery.zip planetary.zip deferred.zip

.PHONY: gallery.zip
gallery.zip: gallery
	zip -r gallery.zip gallery

.PHONY: planetary.zip
planetary.zip: planetary
	zip -r planetary.zip planetary

.PHONY: deferred.zip
deferred.zip: deferred
	zip -r deferred.zip deferred
