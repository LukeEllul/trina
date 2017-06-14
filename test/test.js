const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;
chai.should();

require('../trina');

describe('trina', function () {
    it('should return a function which returns a promise', function () {
        let result = trina(val => val, AND, val => val);
        expect(result('hey').constructor).to.equal(Promise);
    });
});

describe('AND and OR', function () {
    it('should act as logical && and ||', function () {
        let tests = [
            {
                args: [val => val, AND, val => val + ' paws'],
                expected: 'boccu paws'
            },
            {
                args: [
                    val => Promise.reject(val), OR,
                    val => val + ' paws', AND,
                    val => val + ' hey'
                ],
                expected: 'boccu paws hey'
            }
        ];

        tests.forEach(function (test) {
            trina.apply(null, test.args)('boccu')
                .should.eventually.be.equal(test.expected);
        });

        trina(val => Promise.reject(val), OR, val => val + ' pipu')
            ('boccu').should.eventually.be.equal('boccu pipu');
    });
});

describe('NOT', function () {
    return it('should act as normal not operator', function () {
        trina(
            NOT(val => val + ' hey'), AND,
            val => val + ' nuccu', OR,
            val => val + ' paws'
        )('boccu').should.eventually.be.equal('boccu hey paws');
    })
});

describe('sleep', function () {
    it('should act as setTimeout but with seconds', function () {
        return trina(
            val => val + ' hey', AND,
            sleep(1)
        )('boccu').should.eventually.be.equal('boccu hey');
    })
});

describe('trina in trina', function () {
    it('trina should wait for trina', function () {
        return trina(
            val => val + ' hey', AND,
            trina(
                val => val + ' huhu', AND,
                sleep(1)
            ), AND,
            val => ' haha'
        )('boccu').should.eventually.be.equal('boccu hey huhu haha');
    })
});

describe('writeJSON and readJSON', function () {
    it('should write json file and read from same json file', function () {
        return trina(
            writeJSON('obj.json'), AND,
            () => 'obj.json', AND,
            readJSON, AND,
            val => JSON.stringify(val)
        )({ boccu: 'paws' })
            .should.eventually.be.equal(JSON.stringify({ boccu: 'paws' }));
    });
});

describe('exists', function () {
    it('should check if file exists', function () {
        return trina(
            exists('trina.js')
        )('boccu')
            .should.eventually.be.equal('boccu');
    });

    it('should reject when searching for te.tutu', function () {
        return trina(
            exists('te.tutu')
        )('boccu')
            .should.be.rejectedWith('boccu');
    });
});

describe('download', function(){
    it('should download a file from some server', function(){
        return trina(
            download('page.html'), AND,
            exists('page.html')
        )('https://github.com/LukeEllul')
        .should.eventually.be.equal('page.html');
    });
});

describe('deleteFile', function(){
    it('should delete a file', function(){
        return (function check(){
            return trina(
                exists('obj.json'), AND,
                deleteFile('obj.json'), OR,
                trina(
                    sleep(1), AND,
                    check
                )
            )('');
        })()
        .should.eventually.be.equal('');
    });
});

describe('on', function(){
    it('should handle events', function(){
        let EventEmitter = require('events');
        let event = new EventEmitter();

        trina(
            on('event'), AND,
            (n1, n2) => n1 + n2
        )(event)
        .should.eventually.be.equal(3);

        event.emit('event', 1, 2);
    });
});