all: piigeon.xpi

piigeon.xpi: *
	python build.py -v public -n 1.5.0
	rm -rf piigeon.xpi
	zip -r piigeon.xpi chrome defaults chrome.manifest install.rdf
clean:
	rm -rf piigeon.xpi
